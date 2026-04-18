package com.itpm.website.repos.problemsreview;

import com.itpm.website.enities.problemsreview.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Optional<ChatMessage> findByIdAndConversationId(Long id, Long conversationId);
}
