package com.itpm.website.dtos.learning;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SharedResourceResponseDTO {
    private Long id;
    private String title;
    private String description;
    private String resourceType;
    private String originalFileName;
    private Long fileSize;
    private String contentType;
    private Long uploadedBy;
    private String uploaderName;
    private String uploaderRole;
    private LocalDateTime uploadedAt;
    private String year;
    private String semester;
}
