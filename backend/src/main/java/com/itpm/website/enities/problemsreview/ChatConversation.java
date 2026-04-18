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
@Table(name = "chat_conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(length = 20)
    private String status = "ACTIVE";

    private Long ownerUserId;

    private Long participantOneId;

    private Long participantTwoId;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC, id ASC")
    private List<ChatMessage> messages = new ArrayList<>();

    public void addMessage(ChatMessage message) {
        message.setConversation(this);
        messages.add(message);
    }

    public void removeMessage(ChatMessage message) {
        messages.remove(message);
        message.setConversation(null);
    }
}

