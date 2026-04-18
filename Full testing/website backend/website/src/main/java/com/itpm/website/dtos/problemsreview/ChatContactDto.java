package com.itpm.website.dtos.problemsreview;

public record ChatContactDto(
        Long id,
        String firstName,
        String lastName,
        String name,
        String email,
        String phoneNumber,
        String role,
        String imageUrl
) {
}
