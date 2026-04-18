package com.itpm.website.dtos.problemsreview;

public record ChatAttachmentDto(
        String kind,
        String name,
        String url,
        String contentType,
        Long size
) {
}

