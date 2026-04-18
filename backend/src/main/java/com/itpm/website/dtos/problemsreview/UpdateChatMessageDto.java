package com.itpm.website.dtos.problemsreview;

import jakarta.validation.constraints.NotBlank;

public record UpdateChatMessageDto(
        @NotBlank String content
) {
}