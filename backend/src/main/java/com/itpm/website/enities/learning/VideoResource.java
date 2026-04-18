package com.itpm.website.enities.learning;

import com.itpm.website.dtos.learning.Semester;
import com.itpm.website.dtos.learning.Year;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_resources")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;  // Module name         // Module name
    private String description;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private Long uploadedBy;
    private LocalDateTime uploadedAt;

    @Column(length = 20)
    private String academicYear;

    @Enumerated(EnumType.STRING)
    private Year year;

    @Enumerated(EnumType.STRING)
    private Semester semester;       // 1sem, 2sem
}
