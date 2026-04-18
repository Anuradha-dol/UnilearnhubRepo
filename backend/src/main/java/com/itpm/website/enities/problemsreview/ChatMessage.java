package com.itpm.website.enities.problemsreview;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ChatConversation conversation;

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

    private LocalDateTime updatedAt = LocalDateTime.now();

    private boolean edited = false;
}

