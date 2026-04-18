package com.itpm.website.dtos.problemsreview;

import java.time.LocalDateTime;
import java.util.List;

public record SupportThreadDto(
        Long id,
        Long userId,
        String username,
        String email,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<SupportMessageDto> messages
) {
}
