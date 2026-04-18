package com.itpm.website.service.post;

import java.util.List;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.itpm.website.dtos.post.NotificationResponse;
import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Comment;
import com.itpm.website.enities.post.Post;

public interface NotificationService {
    void notifyUsersForNewPost(Post post);

    void notifyUsersMentionedInPost(Post post, List<User> mentionedUsers);

    void notifyUsersMentionedInComment(Post post, Comment comment, List<User> mentionedUsers);

    List<NotificationResponse> getNotificationsForUser(Long userId);

    List<NotificationResponse> getNotificationsForUser(Long userId, int limit);

    long markNotificationAsRead(Long notificationId, Long userId);

    long markAllNotificationsAsRead(Long userId);

    long getUnreadCount(Long userId);

    SseEmitter subscribe(Long userId);
}
