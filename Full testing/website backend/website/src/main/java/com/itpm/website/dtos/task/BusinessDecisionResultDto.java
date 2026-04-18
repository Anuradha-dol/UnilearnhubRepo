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
public class BusinessDecisionResultDto {
    private int score;
    private int xpBonus;
    private String result;
    private String recommendation;
    private LocalDateTime sessionExpiresAt;
}
