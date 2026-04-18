package com.itpm.website.dtos.task;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MainTaskRequest {
    private MainTaskDetails mainTask;
    private List<SubTaskDetails> subTasks;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MainTaskDetails {
        private String title;
        private String description;
        private TaskDifficulty difficulty;
        private LocalDate startDate;
        private LocalDate endDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubTaskDetails {
        private String title;
    }
}
