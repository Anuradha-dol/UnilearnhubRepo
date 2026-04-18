package com.itpm.website.controller.task;

import com.itpm.website.dtos.task.AdminTaskCreateRequest;
import com.itpm.website.dtos.task.MainTaskResponseDTO;
import com.itpm.website.dtos.task.UserResponseDto;
import com.itpm.website.enities.User;
import com.itpm.website.service.task.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class TaskAdminController {

    private final TaskService taskService;

    @PostMapping("/assign")
    public ResponseEntity<MainTaskResponseDTO> assignTask(
            @Valid @RequestBody AdminTaskCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskService.assignTask(request, currentUser));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getAssignableUsers() {
        return ResponseEntity.ok(taskService.getAssignableUsers());
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<MainTaskResponseDTO>> getAssignedTasks() {
        return ResponseEntity.ok(taskService.getAllTaskResponses());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignedTask(@PathVariable Long id) {
        taskService.deleteMainTaskAsAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
