package com.itpm.website.dtos.problemsreview;

import java.time.LocalDateTime;

public record SupportMessageDto(
        Long id,
        String senderRole,
        String senderName,
        Long senderId,
        String content,
        SupportAttachmentDto attachment,
        LocalDateTime createdAt,
        boolean mine,
        boolean deletable
) {
}
