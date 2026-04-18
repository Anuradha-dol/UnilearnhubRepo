package com.itpm.website.controller.task;

import com.itpm.website.dtos.task.LeaderboardEntryDto;
import com.itpm.website.dtos.task.MainTaskRequest;
import com.itpm.website.dtos.task.MainTaskResponseDTO;
import com.itpm.website.dtos.task.SubTaskStatus;
import com.itpm.website.dtos.task.TaskDashboardResponse;
import com.itpm.website.enities.User;
import com.itpm.website.enities.task.Notifications;
import com.itpm.website.enities.task.SubTask;
import com.itpm.website.service.task.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/create")
    public ResponseEntity<MainTaskResponseDTO> createTask(
            @RequestBody MainTaskRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskService.createSelfTask(request, currentUser));
    }

    @GetMapping("/my")
    public ResponseEntity<List<MainTaskResponseDTO>> getMyTasks(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskService.getTaskResponsesByUser(currentUser));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<TaskDashboardResponse> getDashboard(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskService.getDashboard(currentUser));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDto>> getLeaderboard() {
        return ResponseEntity.ok(taskService.getLeaderboard());
    }

    @PutMapping("/subtask/{id}/status")
    public ResponseEntity<SubTask> updateSubTaskStatus(
            @PathVariable Long id,
            @RequestParam SubTaskStatus status,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskService.updateSubTaskStatus(id, status, currentUser));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<MainTaskResponseDTO> completeTask(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskService.completeTask(id, currentUser));
    }

    @DeleteMapping("/maintask/{id}")
    public ResponseEntity<Void> deleteMainTask(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        taskService.deleteMainTask(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/subtask/{id}")
    public ResponseEntity<Void> deleteSubTask(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        taskService.deleteSubTask(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Map<String, Object>>> getNotifications(@AuthenticationPrincipal User currentUser) {
        List<Notifications> notifications = taskService.getUnreadNotifications(currentUser.getUserId());
        List<Map<String, Object>> result = notifications.stream().map(notification -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", notification.getId());
            map.put("message", notification.getMessage());
            map.put("read", notification.isRead());
            map.put("createdAt", notification.getCreatedAt());
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markNotificationRead(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        taskService.markNotificationRead(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        taskService.deleteNotification(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
