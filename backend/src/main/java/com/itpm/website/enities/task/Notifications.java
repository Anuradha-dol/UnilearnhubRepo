package com.itpm.website.enities.task;

import com.itpm.website.enities.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notify")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notifications {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    @Builder.Default
    private boolean read = false;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}

