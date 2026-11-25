package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.NeedRequest;
import com.hackathon.resourceallocation.dto.NeedResponse;
import com.hackathon.resourceallocation.exception.ResourceNotFoundException;
import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.User;
import com.hackathon.resourceallocation.repository.NeedRepository;
import com.hackathon.resourceallocation.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class NeedsService {

    private final NeedRepository needRepository;
    private final UserRepository userRepository;
    private final NeedAnalysisService needAnalysisService;

    // ─────────────────────────────────────────────────────────────
    // MY NEEDS (REPORTER)
    // ─────────────────────────────────────────────────────────────

    public List<NeedResponse> getMyNeeds(String status) {
        User user = currentUser();

        List<Need> needs = hasText(status)
                ? needRepository.findByCreatedByAndStatus(user, parseStatus(status))
                : needRepository.findByCreatedBy(user);

        return needs.stream().map(NeedResponse::from).toList();
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────

    /**
     * Persists the need, then hands it to the async analyser.
     * Deliberately not @Transactional: the row must be committed before the
     * analysis thread tries to read it.
     */
    public NeedResponse createNeed(NeedRequest request) {
        Need need = Need.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .locationName(request.getLocationName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .reporterName(request.getReporterName())
                .reporterContact(request.getReporterContact())
                .status(Need.NeedStatus.OPEN)
                .source("TEXT")
                .createdBy(currentUser())
                .build();

        Need saved = needRepository.save(need);
        log.info("Created new need with ID: {}", saved.getId());

        needAnalysisService.analyzeAsync(saved.getId());
        return NeedResponse.from(saved);
    }

    // ─────────────────────────────────────────────────────────────
    // ANALYSIS (manual trigger)
    // ─────────────────────────────────────────────────────────────

    public NeedResponse triggerAnalysis(Long id) {
        return needAnalysisService.analyzeNow(id);
    }

    // ─────────────────────────────────────────────────────────────
    // LIST with optional filters
    // ─────────────────────────────────────────────────────────────

    public List<NeedResponse> getAllNeeds(String status, String category,
                                          String urgency, String keyword) {
        // Parsed up front so an unknown value is rejected as a bad request (400),
        // not as a database error inside the query.
        Need.NeedStatus statusFilter = hasText(status) ? parseStatus(status) : null;
        Need.Category categoryFilter = hasText(category) ? parseCategory(category) : null;
        Need.UrgencyLevel urgencyFilter = hasText(urgency) ? parseUrgency(urgency) : null;

        Specification<Need> filter = (root, query, cb) -> {
            List<Predicate> conditions = new ArrayList<>();

            if (statusFilter != null) {
                conditions.add(cb.equal(root.get("status"), statusFilter));
            }
            if (categoryFilter != null) {
                conditions.add(cb.equal(root.get("category"), categoryFilter));
            }
            if (urgencyFilter != null) {
                conditions.add(cb.equal(root.get("urgency"), urgencyFilter));
            }
            if (hasText(keyword)) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                conditions.add(cb.or(
                        cb.like(cb.lower(root.get("title").as(String.class)), pattern),
                        cb.like(cb.lower(root.get("description").as(String.class)), pattern)));
            }

            return cb.and(conditions.toArray(new Predicate[0]));
        };

        return needRepository.findAll(filter, Sort.by(Sort.Direction.DESC, "priorityScore"))
                .stream()
                .map(NeedResponse::from)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────
    // OTHER ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    public List<NeedResponse> getNeedsForMap() {
        return needRepository.findAllWithCoordinates()
                .stream()
                .map(NeedResponse::from)
                .toList();
    }

    public NeedResponse getNeedById(Long id) {
        return NeedResponse.from(getOrThrow(id));
    }

    @Transactional
    public NeedResponse updateStatus(Long id, String status) {
        Need need = getOrThrow(id);
        need.setStatus(parseStatus(status));
        return NeedResponse.from(needRepository.save(need));
    }

    @Transactional
    public void deleteNeed(Long id) {
        needRepository.deleteById(id);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Current user not found: " + auth.getName()));
    }

    private Need getOrThrow(Long id) {
        return needRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Need not found with ID: " + id));
    }

    private static Need.NeedStatus parseStatus(String status) {
        return Need.NeedStatus.valueOf(status.toUpperCase());
    }

    private static Need.Category parseCategory(String category) {
        return Need.Category.valueOf(category.toUpperCase());
    }

    private static Need.UrgencyLevel parseUrgency(String urgency) {
        return Need.UrgencyLevel.valueOf(urgency.toUpperCase());
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
