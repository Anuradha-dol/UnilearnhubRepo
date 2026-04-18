package com.itpm.website.dtos.learning;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class VideoResponseDTO {
    private Long id;
    private String title;       // Module
    private String description;
    private Long fileSize;
    private String contentType;
    private Long uploadedBy;
    private LocalDateTime uploadedAt;
    private String academicYear;
    private String year;
    private String semester;
}
