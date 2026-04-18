package com.itpm.website.enities.learning;

import com.itpm.website.dtos.learning.ResourceType;
import com.itpm.website.dtos.learning.Semester;
import com.itpm.website.dtos.learning.Year;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "shared_library_resources")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedLibraryResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResourceType resourceType;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String filePath;

    private Long fileSize;

    private String contentType;

    @Column(nullable = false)
    private Long uploadedBy;

    private LocalDateTime uploadedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Year year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Semester semester;
}
