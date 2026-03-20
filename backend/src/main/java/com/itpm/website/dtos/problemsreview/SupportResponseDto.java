package com.itpm.website.dtos.problemsreview;

import jakarta.validation.constraints.NotBlank;

public record SupportResponseDto(
        @NotBlank String response
) {}
