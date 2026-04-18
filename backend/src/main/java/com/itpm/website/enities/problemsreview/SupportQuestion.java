package com.itpm.website.enities.problemsreview;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    private String status = "OPEN"; // OPEN, ANSWERED, CLOSED

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "supportQuestion", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC, id ASC")
    private List<SupportMessage> messages = new ArrayList<>();

    public void addMessage(SupportMessage message) {
        message.setSupportQuestion(this);
        messages.add(message);
    }

    public void removeMessage(SupportMessage message) {
        messages.remove(message);
        message.setSupportQuestion(null);
    }
}

