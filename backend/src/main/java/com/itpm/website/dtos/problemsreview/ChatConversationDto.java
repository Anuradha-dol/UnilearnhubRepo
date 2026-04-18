package com.itpm.website.dtos.problemsreview;

import java.time.LocalDateTime;
import java.util.List;

public record ChatConversationDto(
        Long id,
        String type,
        String status,
        String title,
        String subtitle,
        boolean supportConversation,
        ChatContactDto partner,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<ChatMessageDto> messages
) {
}
