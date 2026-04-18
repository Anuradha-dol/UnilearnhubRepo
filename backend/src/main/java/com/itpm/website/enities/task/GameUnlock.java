package com.itpm.website.enities.task;

import com.itpm.website.dtos.task.GameFeatureType;
import com.itpm.website.enities.User;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "game_unlocks",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "feature"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameUnlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private GameFeatureType feature;

    private int requiredTasks;

    private int requiredXp;

    @Builder.Default
    private boolean unlocked = false;

    private LocalDateTime unlockedAt;

    private LocalDateTime sessionStartedAt;

    private LocalDateTime sessionExpiresAt;

    private LocalDateTime lastRewardAt;
}
