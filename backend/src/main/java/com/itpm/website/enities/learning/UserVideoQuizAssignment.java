package com.itpm.website.enities.learning;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_video_quiz_assignments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_video_quiz_assignment", columnNames = {"user_id", "video_id"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVideoQuizAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "video_id", nullable = false)
    private Long videoId;

    @Column(name = "quiz_set", nullable = false, length = 120)
    private String quizSet;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;
}
