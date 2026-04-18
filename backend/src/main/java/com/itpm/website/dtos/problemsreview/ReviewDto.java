package com.itpm.website.dtos.problemsreview;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class ReviewDto {

    public record CreateReviewDto(
            @NotBlank String comment,
            @Min(1) @Max(5) int rating,
            @NotBlank String status
    ) {}

    public record UpdateReviewDto(
            @NotBlank String comment,
            @Min(1) @Max(5) int rating,
            @NotBlank String status
    ) {}
}

