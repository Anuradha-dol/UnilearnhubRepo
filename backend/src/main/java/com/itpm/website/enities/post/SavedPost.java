package com.itpm.website.enities.post;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.itpm.website.enities.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "saved_posts",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_saved_posts_user_post", columnNames = {"user_id", "post_id"})
        },
        indexes = {
                @Index(name = "idx_saved_posts_user", columnList = "user_id"),
                @Index(name = "idx_saved_posts_collection", columnList = "collection_id"),
                @Index(name = "idx_saved_posts_created_at", columnList = "createdAt")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long savedPostId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Post post;

    @ManyToOne(optional = false)
    @JoinColumn(name = "collection_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private PostCollection collection;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
