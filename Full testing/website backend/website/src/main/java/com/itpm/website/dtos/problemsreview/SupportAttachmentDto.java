package com.itpm.website.dtos.problemsreview;

public record SupportAttachmentDto(
        String kind,
        String name,
        String url,
        String contentType,
        Long size
) {
}
