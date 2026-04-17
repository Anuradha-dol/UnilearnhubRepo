package com.itpm.website.service.learning;

import com.itpm.website.dtos.learning.Semester;
import com.itpm.website.dtos.learning.VideoResponseDTO;
import com.itpm.website.dtos.learning.Year;
import com.itpm.website.enities.learning.VideoResource;
import com.itpm.website.repos.learning.VideoResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class VideoResourceServiceImpl implements VideoResourceService {

    private final VideoResourceRepository repository;
    private static final Set<String> VIDEO_EXTENSIONS = Set.of("mp4", "mov", "avi", "mkv", "webm", "m4v");

    private final String UPLOAD_DIR = "C:/UniLearnHub/uploads/videos/";

    @Override
    public VideoResponseDTO uploadVideo(MultipartFile file, String title, String description, String yearStr, String semesterStr, String academicYear, Long userId) throws IOException {

        Year year = Year.valueOf(yearStr.toUpperCase());
        Semester semester = Semester.valueOf(semesterStr.toUpperCase());
        String normalizedAcademicYear = normalizeAcademicYear(academicYear);
        validateVideoFile(file);

        File dir = new File(UPLOAD_DIR);
        if (!dir.exists()) dir.mkdirs();

        String fileName = "video_" + userId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        File destFile = new File(UPLOAD_DIR + fileName);
        file.transferTo(destFile);

        VideoResource video = VideoResource.builder()
                .title(title)
                .description(description)
                .academicYear(normalizedAcademicYear)
                .year(year)
                .semester(semester)
                .fileName(fileName)
                .filePath(destFile.getAbsolutePath())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(userId)
                .uploadedAt(LocalDateTime.now())
                .build();

        repository.save(video);
        return map(video);
    }

    @Override
    public List<VideoResponseDTO> getAllVideos() {
        return repository.findAll().stream().map(this::map).toList();
    }

    @Override
    public List<VideoResponseDTO> getVideosByUser(Long userId) {
        return repository.findByUploadedBy(userId).stream().map(this::map).toList();
    }

    @Override
    public List<VideoResponseDTO> getVideosByFilter(String yearStr, String semesterStr, String title, String academicYear) {

        List<Year> years = (yearStr == null || yearStr.isBlank()) ? null :
                Arrays.stream(yearStr.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(s -> Year.valueOf(s.toUpperCase()))
                        .distinct()
                        .toList();

        List<Semester> semesters = (semesterStr == null || semesterStr.isBlank()) ? null :
                Arrays.stream(semesterStr.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(s -> Semester.valueOf(s.toUpperCase()))
                        .distinct()
                        .toList();

        String titleFilter = (title == null || title.isBlank()) ? null : title.toLowerCase();
        String academicYearFilter = (academicYear == null || academicYear.isBlank()) ? null : normalizeAcademicYear(academicYear);

        return repository.filterVideos(titleFilter, academicYearFilter, years, semesters)
                .stream()
                .map(this::map)
                .toList();
    }

    @Override
    public VideoResponseDTO updateVideo(Long id, String title, String description, String yearStr, String semesterStr, String academicYear, Long userId) {
        VideoResource video = repository.findById(id).orElseThrow(() -> new RuntimeException("Video not found"));
        if (!video.getUploadedBy().equals(userId)) throw new RuntimeException("Not authorized");

        Year year = Year.valueOf(yearStr.toUpperCase());
        Semester semester = Semester.valueOf(semesterStr.toUpperCase());
        String normalizedAcademicYear = normalizeAcademicYear(academicYear);

        video.setTitle(title);
        video.setDescription(description);
        video.setAcademicYear(normalizedAcademicYear);
        video.setYear(year);
        video.setSemester(semester);

        repository.save(video);
        return map(video);
    }

    @Override
    public void deleteVideo(Long id, Long userId) {
        VideoResource video = repository.findById(id).orElseThrow(() -> new RuntimeException("Video not found"));
        if (!video.getUploadedBy().equals(userId)) throw new RuntimeException("Not authorized");

        File file = new File(video.getFilePath());
        if (file.exists()) file.delete();

        repository.delete(video);
    }

    @Override
    public Resource streamVideo(Long id) {
        VideoResource video = repository.findById(id).orElseThrow(() -> new RuntimeException("Video not found"));
        return new FileSystemResource(video.getFilePath());
    }

    private VideoResponseDTO map(VideoResource video) {
        return VideoResponseDTO.builder()
                .id(video.getId())
                .title(video.getTitle())
                .description(video.getDescription())
                .fileSize(video.getFileSize())
                .contentType(video.getContentType())
                .uploadedBy(video.getUploadedBy())
                .uploadedAt(video.getUploadedAt())
                .academicYear(video.getAcademicYear())
                .year(String.valueOf(video.getYear()))
                .semester(String.valueOf(video.getSemester()))
                .build();
    }

    @Override
    public List<VideoResource> findByYearAndSemester(String year, String semester) {
        return repository.findByYearAndSemester(year, semester);
    }

    @Override
    public List<VideoResource> findByTitleContainingIgnoreCaseAndYear(String title, String year) {
        return repository.findByTitleContainingIgnoreCaseAndYear(title, year);
    }


    @Override
    public Optional<VideoResource> findById(Long id) {
        return repository.findById(id);
    }

    private String normalizeAcademicYear(String academicYear) {
        if (!StringUtils.hasText(academicYear)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year is required");
        }

        String value = academicYear.trim();
        if (!value.matches("\\d{4}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year must be a 4-digit year like 2019 or 2020");
        }
        return value;
    }

    private void validateVideoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A video file is required");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String originalFileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        int dotIndex = originalFileName.lastIndexOf('.');
        String extension = dotIndex >= 0 && dotIndex < originalFileName.length() - 1
                ? originalFileName.substring(dotIndex + 1).toLowerCase()
                : "";

        if (!contentType.startsWith("video/") && !VIDEO_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only video files are allowed");
        }
    }
}
