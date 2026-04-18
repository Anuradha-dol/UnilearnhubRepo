package com.itpm.website.enities.problemsreview;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupportQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String username;

    private String email;

    @Column(length = 1000)
    private String question;

    @Column(length = 1000)
    private String adminResponse;

    private String status = "Pending"; // OPEN, ANSWERED, CLOSED

    private LocalDateTime createdAt = LocalDateTime.now();
}

