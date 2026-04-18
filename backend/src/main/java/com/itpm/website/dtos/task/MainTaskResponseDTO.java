package com.itpm.website.dtos.task;

import com.itpm.website.enities.task.SubTask;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MainTaskResponseDTO {
    private Long id;
    private String title;
    private String description;
    private TaskDifficulty difficulty;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer xpReward;
    private double progress;
    private boolean complete;
    private boolean rewardGranted;
    private UserResponseDto user;      // user info
    private String assignedBy;
    private LocalDateTime createdAt;   // creation date
    private LocalDateTime completedAt;
    private List<SubTask> subTasks;
}
