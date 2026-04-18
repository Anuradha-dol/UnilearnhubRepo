package com.itpm.website.enities.task;

import com.itpm.website.dtos.task.SubTaskStatus;
import com.itpm.website.dtos.task.TaskDifficulty;
import com.itpm.website.enities.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MainTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 1500)
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TaskDifficulty difficulty = TaskDifficulty.MEDIUM;

    @Builder.Default
    private Integer xpReward = 75;

    @Builder.Default
    private boolean rewardGranted = false;

    private LocalDateTime completedAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "assigned_by_user_id")
    private User assignedBy;

    @Builder.Default
    @OneToMany(mappedBy = "mainTask", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubTask> subTasks = new ArrayList<>();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();


    public void addSubTask(SubTask subTask) {
        if(this.subTasks == null){
            this.subTasks = new ArrayList<>();
        }

        subTask.setStartDate(this.startDate);
        subTask.setEndDate(this.endDate);
        subTask.setMainTask(this);

        this.subTasks.add(subTask);
    }


    public double getProgress() {
        if (subTasks == null || subTasks.isEmpty()) {
            return isComplete() ? 100 : 0;
        }
        long completed = subTasks.stream()
                .filter(s -> s.getStatus() == SubTaskStatus.COMPLETE)
                .count();
        return ((double) completed / subTasks.size()) * 100;
    }


    public boolean isComplete() {
        if (subTasks == null || subTasks.isEmpty()) {
            return rewardGranted || completedAt != null;
        }
        return subTasks.stream()
                .allMatch(s -> s.getStatus() == SubTaskStatus.COMPLETE);
    }
}
