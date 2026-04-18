package com.itpm.website.service.post;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.itpm.website.dtos.post.NotificationResponse;
import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Comment;
import com.itpm.website.enities.post.Notification;
import com.itpm.website.enities.post.Post;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.post.NotificationsRepository;
import com.itpm.website.repos.post.PostRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final long SSE_TIMEOUT_MS = 60L * 60L * 1000L;

    private final NotificationsRepository notificationRepository;
    private final UserRepo userRepo;
    private final PostRepository postRepository;

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();
    private final Map<Long, Boolean> bootstrapAttemptedByUser = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public void notifyUsersForNewPost(Post post) {
        if (post == null || post.getLearningPreference() == null || post.getUser() == null) {
            return;
        }

        List<User> recipients = userRepo.findByInterestAndUserIdNot(
                post.getLearningPreference(),
                post.getUser().getUserId()
        );

        String authorName = post.getUser().getFirstname() + " " + post.getUser().getLastName();
        String message = authorName + " published a new post for " + post.getLearningPreference().name().replace("_", " ");

        for (User recipient : recipients) {
            if (notificationRepository.existsByRecipient_UserIdAndPost_PostId(recipient.getUserId(), post.getPostId())) {
                continue;
            }

            Notification notification = notificationRepository.save(
                    Notification.builder()
                            .recipient(recipient)
                            .post(post)
                            .message(message)
                            .learningPreference(post.getLearningPreference())
                            .isRead(false)
                            .build()
            );

            NotificationResponse payload = toResponse(notification, authorName);
            sendToUser(recipient.getUserId(), payload);
        }
    }

    @Override
    @Transactional
    public void notifyUsersMentionedInPost(Post post, List<User> mentionedUsers) {
        if (post == null || post.getUser() == null || mentionedUsers == null || mentionedUsers.isEmpty()) {
            return;
        }

        String authorName = post.getUser().getFirstname() + " " + post.getUser().getLastName();
        String message = authorName + " mentioned you in a post";

        for (User mentionedUser : mentionedUsers) {
            if (mentionedUser == null || mentionedUser.getUserId() == null) {
                continue;
            }
            if (mentionedUser.getUserId().equals(post.getUser().getUserId())) {
                continue;
            }
            if (notificationRepository.existsByRecipient_UserIdAndPost_PostId(mentionedUser.getUserId(), post.getPostId())) {
                continue;
            }

            Notification notification = notificationRepository.save(
                    Notification.builder()
                            .recipient(mentionedUser)
                            .post(post)
                            .message(message)
                            .learningPreference(post.getLearningPreference())
                            .isRead(false)
                            .build()
            );

            sendToUser(mentionedUser.getUserId(), toResponse(notification, authorName));
        }
    }

    @Override
    @Transactional
    public void notifyUsersMentionedInComment(Post post, Comment comment, List<User> mentionedUsers) {
        if (post == null || comment == null || comment.getUser() == null || post.getLearningPreference() == null) {
            return;
        }
        if (mentionedUsers == null || mentionedUsers.isEmpty()) {
            return;
        }

        String authorName = comment.getUser().getFirstname() + " " + comment.getUser().getLastName();
        String message = authorName + " mentioned you in a comment";

        for (User mentionedUser : mentionedUsers) {
            if (mentionedUser == null || mentionedUser.getUserId() == null) {
                continue;
            }
            if (mentionedUser.getUserId().equals(comment.getUser().getUserId())) {
                continue;
            }

            Notification notification = notificationRepository.save(
                    Notification.builder()
                            .recipient(mentionedUser)
                            .post(post)
                            .message(message)
                            .learningPreference(post.getLearningPreference())
                            .isRead(false)
                            .build()
            );

            sendToUser(mentionedUser.getUserId(), toResponse(notification, authorName));
        }
    }

    @Override
    public List<NotificationResponse> getNotificationsForUser(Long userId) {
        return getNotificationsForUser(userId, 30);
    }

    @Override
    public List<NotificationResponse> getNotificationsForUser(Long userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<Notification> existing = notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(
                userId,
                PageRequest.of(0, safeLimit)
        );
        if (existing.isEmpty() && shouldAttemptBootstrap(userId)) {
            bootstrapNotificationsForUser(userId);
            existing = notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(
                    userId,
                    PageRequest.of(0, safeLimit)
            );
        }

        return existing
                .stream()
                .map(item -> toResponse(item, item.getPost().getAuthorName()))
                .toList();
    }

    @Override
    @Transactional
    public long markNotificationAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getRecipient().getUserId().equals(userId)) {
            throw new SecurityException("Cannot update notification for another user");
        }

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }

        long unreadCount = getUnreadCount(userId);
        sendUnreadCountToUser(userId, unreadCount);
        return unreadCount;
    }

    @Override
    @Transactional
    public long markAllNotificationsAsRead(Long userId) {
        notificationRepository.markAllAsReadByRecipientUserId(userId);
        long unreadCount = getUnreadCount(userId);
        sendUnreadCountToUser(userId, unreadCount);
        return unreadCount;
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipient_UserIdAndIsReadFalse(userId);
    }

    @Override
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        emittersByUser.computeIfAbsent(userId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((ex) -> removeEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
            emitter.send(SseEmitter.event().name("unread-count").data(getUnreadCount(userId)));
        } catch (IOException ex) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    private void sendToUser(Long userId, NotificationResponse payload) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        long unreadCount = getUnreadCount(userId);

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("new-notification").data(payload));
                emitter.send(SseEmitter.event().name("unread-count").data(unreadCount));
            } catch (IOException ex) {
                removeEmitter(userId, emitter);
            }
        }
    }

    private void sendUnreadCountToUser(Long userId, long unreadCount) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("unread-count").data(unreadCount));
            } catch (IOException ex) {
                removeEmitter(userId, emitter);
            }
        }
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters == null) {
            return;
        }
        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByUser.remove(userId);
        }
    }

    @Transactional
    protected void bootstrapNotificationsForUser(Long userId) {
        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty() || userOpt.get().getInterest() == null) {
            return;
        }

        User user = userOpt.get();
        List<Post> recentMatchingPosts = postRepository.findTop25ByLearningPreferenceAndUser_UserIdNotOrderByCreatedAtDesc(
                user.getInterest(),
                userId
        );

        for (Post post : recentMatchingPosts) {
            if (notificationRepository.existsByRecipient_UserIdAndPost_PostId(userId, post.getPostId())) {
                continue;
            }

            String message = post.getAuthorName() + " published a new post for "
                    + post.getLearningPreference().name().replace("_", " ");

            notificationRepository.save(
                    Notification.builder()
                            .recipient(user)
                            .post(post)
                            .message(message)
                            .learningPreference(post.getLearningPreference())
                            .isRead(false)
                            .build()
            );
        }
    }

    private boolean shouldAttemptBootstrap(Long userId) {
        return bootstrapAttemptedByUser.putIfAbsent(userId, Boolean.TRUE) == null;
    }

    private NotificationResponse toResponse(Notification notification, String authorName) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .message(notification.getMessage())
                .postId(notification.getPost().getPostId())
                .learningPreference(notification.getLearningPreference())
                .authorName(authorName)
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
