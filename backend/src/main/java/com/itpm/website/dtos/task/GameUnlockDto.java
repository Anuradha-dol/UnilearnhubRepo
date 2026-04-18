package com.itpm.website.dtos.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameUnlockDto {
    private Long id;
    private GameFeatureType feature;
    private String title;
    private String description;
    private boolean unlocked;
    private int requiredTasks;
    private int requiredXp;
    private LocalDateTime unlockedAt;
    private LocalDateTime sessionExpiresAt;
    private boolean activeSession;
}
