package com.itpm.website.dtos.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTaskCreateRequest {

    @NotBlank
    private String title;

    private String description;

    @Builder.Default
    private TaskDifficulty difficulty = TaskDifficulty.MEDIUM;

    private LocalDate startDate;

    @NotNull
    private LocalDate deadline;

    private Integer xpReward;

    @NotNull
    private Long assignedUserId;

    @Builder.Default
    private List<String> subTaskTitles = new ArrayList<>();
}
