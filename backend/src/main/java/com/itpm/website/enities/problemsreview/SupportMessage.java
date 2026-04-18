package com.itpm.website.enities.problemsreview;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "support_question_id", nullable = false)
    private SupportQuestion supportQuestion;

    private Long senderId;

    @Column(nullable = false, length = 20)
    private String senderRole;

    @Column(nullable = false, length = 200)
    private String senderName;

    @Column(length = 4000)
    private String content;

    @Column(length = 500)
    private String attachmentUrl;

    @Column(length = 255)
    private String attachmentName;

    @Column(length = 120)
    private String attachmentContentType;

    @Column(length = 20)
    private String attachmentKind;

    private Long attachmentSize;

    private LocalDateTime createdAt = LocalDateTime.now();
}
