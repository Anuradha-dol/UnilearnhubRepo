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
public class RewardSummaryDto {
    private Long id;
    private RewardType rewardType;
    private String code;
    private String title;
    private String description;
    private int xpAwarded;
    private LocalDateTime createdAt;
}
