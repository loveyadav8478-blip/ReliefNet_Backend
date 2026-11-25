package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.TaskRequest;
import com.hackathon.resourceallocation.dto.TaskResponse;
import com.hackathon.resourceallocation.exception.ConflictException;
import com.hackathon.resourceallocation.exception.ResourceNotFoundException;
import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.Task;
import com.hackathon.resourceallocation.model.Volunteer;
import com.hackathon.resourceallocation.repository.NeedRepository;
import com.hackathon.resourceallocation.repository.TaskRepository;
import com.hackathon.resourceallocation.repository.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final NeedRepository needRepository;
    private final VolunteerRepository volunteerRepository;

    @Transactional
    public TaskResponse assignVolunteer(TaskRequest request) {
        Need need = needRepository.findById(request.getNeedId())
                .orElseThrow(() -> new ResourceNotFoundException("Need not found"));
        Volunteer volunteer = volunteerRepository.findById(request.getVolunteerId())
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer not found"));

        // A dispatched need already has someone en route: never create a second task for it.
        boolean activeTaskExists = taskRepository.findByNeedId(need.getId()).stream()
                .anyMatch(existing -> existing.getStatus() == Task.TaskStatus.ASSIGNED
                        || existing.getStatus() == Task.TaskStatus.IN_PROGRESS);
        if (activeTaskExists
                || need.getStatus() == Need.NeedStatus.ASSIGNED
                || need.getStatus() == Need.NeedStatus.IN_PROGRESS) {
            throw new ConflictException("This need has already been dispatched to a responder.");
        }

        Task task = Task.builder()
                .need(need)
                .volunteer(volunteer)
                .notes(request.getNotes())
                .status(Task.TaskStatus.ASSIGNED)
                .build();

        need.setStatus(Need.NeedStatus.ASSIGNED);
        volunteer.setIsAvailable(false);

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, String status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Task.TaskStatus newStatus = Task.TaskStatus.valueOf(status.toUpperCase());
        task.setStatus(newStatus);

        switch (newStatus) {
            case COMPLETED -> {
                task.setCompletedAt(LocalDateTime.now());
                task.getNeed().setStatus(Need.NeedStatus.RESOLVED);
                task.getVolunteer().setIsAvailable(true);   // free the volunteer up again
            }
            case IN_PROGRESS -> task.getNeed().setStatus(Need.NeedStatus.IN_PROGRESS);
            case CANCELLED -> {
                task.getNeed().setStatus(Need.NeedStatus.OPEN);
                task.getVolunteer().setIsAvailable(true);
            }
            default -> { /* ASSIGNED needs no side effects */ }
        }

        return TaskResponse.from(taskRepository.save(task));
    }

    public List<TaskResponse> getAllTasks(String status) {
        List<Task> tasks = status != null
                ? taskRepository.findByStatus(Task.TaskStatus.valueOf(status.toUpperCase()))
                : taskRepository.findAll();
        return tasks.stream().map(TaskResponse::from).toList();
    }

    public List<TaskResponse> getTasksByNeed(Long needId) {
        return taskRepository.findByNeedId(needId)
                .stream().map(TaskResponse::from).toList();
    }

    public List<TaskResponse> getTasksByVolunteer(Long volunteerId) {
        return taskRepository.findByVolunteerId(volunteerId)
                .stream().map(TaskResponse::from).toList();
    }
}
