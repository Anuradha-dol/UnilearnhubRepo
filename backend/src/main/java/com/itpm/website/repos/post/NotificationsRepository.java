package com.itpm.website.repos.post;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.itpm.website.enities.post.Notification;

public interface NotificationsRepository extends JpaRepository<Notification, Long> {
    @EntityGraph(attributePaths = {"post", "post.user"})
    List<Notification> findByRecipient_UserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"post", "post.user"})
    List<Notification> findByRecipient_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByRecipient_UserIdAndIsReadFalse(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.isRead = true where n.recipient.userId = :userId and n.isRead = false")
    int markAllAsReadByRecipientUserId(@Param("userId") Long userId);

    boolean existsByRecipient_UserIdAndPost_PostId(Long userId, Long postId);
}
