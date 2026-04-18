package com.itpm.website.controller.post;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.itpm.website.dtos.post.NotificationResponse;
import com.itpm.website.enities.User;
import com.itpm.website.service.post.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponse>> myNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "limit", defaultValue = "30") int limit) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        return ResponseEntity.ok(notificationService.getNotificationsForUser(user.getUserId(), limit));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(user.getUserId())));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, Long>> markRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long notificationId
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        try {
            long unreadCount = notificationService.markNotificationAsRead(notificationId, user.getUserId());
            return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        } catch (SecurityException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, ex.getMessage());
        }
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Long>> markAllRead(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        long unreadCount = notificationService.markAllNotificationsAsRead(user.getUserId());
        return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return notificationService.subscribe(user.getUserId());
    }
}
