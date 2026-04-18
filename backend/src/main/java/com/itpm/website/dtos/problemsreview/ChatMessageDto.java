package com.itpm.website.dtos.problemsreview;

import java.time.LocalDateTime;

public record ChatMessageDto(
        Long id,
        Long senderId,
        String senderName,
        String senderRole,
        String content,
        ChatAttachmentDto attachment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean edited,
        boolean mine,
        boolean editable,
        boolean deletable
) {
}
