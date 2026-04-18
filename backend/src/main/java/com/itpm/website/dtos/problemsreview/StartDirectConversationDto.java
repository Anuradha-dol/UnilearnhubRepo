package com.itpm.website.dtos.problemsreview;

import jakarta.validation.constraints.NotNull;

public record StartDirectConversationDto(
        @NotNull Long recipientId
) {
}
