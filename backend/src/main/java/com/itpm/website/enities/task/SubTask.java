package com.itpm.website.enities.task;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.itpm.website.dtos.task.SubTaskStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private LocalDate startDate;
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SubTaskStatus status = SubTaskStatus.IN_PROCESS;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "main_task_id", nullable = false)
    private MainTask mainTask;
}

