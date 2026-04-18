package com.itpm.website.dtos.task;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDashboardResponse {
    private int xpPoints;
    private int completedTasks;
    private int level;
    private int nextLevelXp;
    private double levelProgress;

    @Builder.Default
    private List<String> badges = new ArrayList<>();

    @Builder.Default
    private List<GameUnlockDto> unlocks = new ArrayList<>();

    @Builder.Default
    private List<RewardSummaryDto> recentRewards = new ArrayList<>();
}
