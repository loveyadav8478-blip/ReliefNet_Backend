package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.AuthDTOs.*;
import com.hackathon.resourceallocation.dto.UserResponse;
import com.hackathon.resourceallocation.exception.ResourceNotFoundException;
import com.hackathon.resourceallocation.model.*;
import com.hackathon.resourceallocation.repository.UserRepository;
import com.hackathon.resourceallocation.repository.VolunteerRepository;
import com.hackathon.resourceallocation.security.JwtUtil;
import com.hackathon.resourceallocation.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final VolunteerRepository volunteerRepository;

    @Value("${app.coordinator.invite-code:}")
    private String coordinatorInviteCode;

    // ── REGISTER ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        // Self-registration is limited to VOLUNTEER or REPORTER
        User.Role role = request.getRole();
        if (role == User.Role.ADMIN || role == User.Role.COORDINATOR) {
            throw new IllegalArgumentException(
                    "Cannot self-register as " + role + ". Contact an administrator.");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role != null ? role : User.Role.VOLUNTEER)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        log.info("New user registered: {} ({})", saved.getEmail(), saved.getRole());

        // ── FIX: auto-create Volunteer profile when role is VOLUNTEER ─────────
        if (saved.getRole() == User.Role.VOLUNTEER) {
            Volunteer volunteer = Volunteer.builder()
                    .name(saved.getName())
                    .email(saved.getEmail())
                    .isAvailable(true)
                    .radiusKm(10)
                    .build();
            volunteer = volunteerRepository.save(volunteer);
            // Link the profile to the account, otherwise /api/auth/me cannot report
            // volunteerId and the two ways of resolving it disagree after a reload.
            saved.setVolunteer(volunteer);
            saved = userRepository.save(saved);
            log.info("Auto-created volunteer profile {} for: {}", volunteer.getId(), saved.getEmail());
        }
        // ─────────────────────────────────────────────────────────────────────

        String token = jwtUtil.generateToken(saved);
        return buildAuthResponse(saved, token);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
            User user = principal.getUser();

            if (!Boolean.TRUE.equals(user.getIsActive())) {
                throw new DisabledException("Account is deactivated. Contact administrator.");
            }

            String token = jwtUtil.generateToken(user);
            log.info("User logged in: {} ({})", user.getEmail(), user.getRole());
            return buildAuthResponse(user, token);

        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid email or password.");
        }
    }

    // ── GET CURRENT USER ──────────────────────────────────────────────────────

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    /**
     * Profile for /api/auth/me. Resolves volunteerId exactly like login does, so a
     * page reload cannot drop the link for accounts whose volunteer_id is not set.
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile() {
        User user = getCurrentUser();
        Long volunteerId = user.getVolunteer() != null
                ? user.getVolunteer().getId()
                : (user.getRole() == User.Role.VOLUNTEER
                        ? volunteerRepository.findByEmail(user.getEmail()).map(Volunteer::getId).orElse(null)
                        : null);
        return UserResponse.from(user, volunteerId);
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────────────────────

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", user.getEmail());
    }

    // ── REGISTER COORDINATOR ──────────────────────────────────────────────────

    @Transactional
    public AuthResponse registerCoordinator(CoordinatorRegisterRequest request) {

        // 1. Validate invite code
        if (coordinatorInviteCode == null || coordinatorInviteCode.isBlank()) {
            throw new IllegalStateException(
                    "Coordinator self-registration is currently disabled. Contact an administrator.");
        }
        if (!coordinatorInviteCode.trim().equals(request.getInviteCode().trim())) {
            throw new IllegalArgumentException("Invalid invite code.");
        }

        // 2. Check email not already taken
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        // 3. Optionally link to an existing Volunteer profile
        Volunteer volunteer = null;
        if (request.getVolunteerId() != null) {
            volunteer = volunteerRepository.findById(request.getVolunteerId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Volunteer not found: " + request.getVolunteerId()));
        }

        // 4. Create COORDINATOR user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.COORDINATOR)
                .isActive(true)
                .volunteer(volunteer)
                .build();

        User saved = userRepository.save(user);
        log.info("New COORDINATOR registered: {}", saved.getEmail());
        return buildAuthResponse(saved, jwtUtil.generateToken(saved));
    }

    // ── HELPER ────────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user, String token) {
        Long volunteerId = user.getRole() == User.Role.VOLUNTEER
                ? volunteerRepository.findByEmail(user.getEmail()).map(Volunteer::getId).orElse(null)
                : null;

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getExpirationMs())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .volunteerId(volunteerId)
                .build();
    }
}