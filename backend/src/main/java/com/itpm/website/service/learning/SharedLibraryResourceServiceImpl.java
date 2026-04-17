package com.itpm.website.service.learning;

import com.itpm.website.dtos.learning.ResourceType;
import com.itpm.website.dtos.learning.Semester;
import com.itpm.website.dtos.learning.SharedResourceResponseDTO;
import com.itpm.website.dtos.learning.Year;
import com.itpm.website.dtos.user.Role;
import com.itpm.website.enities.User;
import com.itpm.website.enities.learning.SharedLibraryResource;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.learning.SharedLibraryResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SharedLibraryResourceServiceImpl implements SharedLibraryResourceService {

    private static final Path UPLOAD_DIR = Paths.get("uploads", "shared-library").toAbsolutePath().normalize();
    private static final Set<String> VIDEO_EXTENSIONS = Set.of("mp4", "mov", "avi", "mkv", "webm", "m4v");
    private static final Set<String> NOTE_EXTENSIONS = Set.of("doc", "docx", "txt", "rtf", "md", "ppt", "pptx");

    private final SharedLibraryResourceRepository repository;
    private final UserRepo userRepo;

    @Override
    public SharedResourceResponseDTO uploadResource(MultipartFile file,
                                                    String title,
                                                    String description,
                                                    String year,
                                                    String semester,
                                                    User user) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A file is required");
        }
        if (!StringUtils.hasText(title)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }

        Year parsedYear = parseYear(year);
        Semester parsedSemester = parseSemester(semester);
        String originalFileName = sanitizeOriginalFileName(file.getOriginalFilename());
        ResourceType resourceType = determineResourceType(originalFileName, file.getContentType());

        String safeStoredName = originalFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedFileName = "shared_" + user.getUserId() + "_" + System.currentTimeMillis() + "_" + safeStoredName;
        Path destination = UPLOAD_DIR.resolve(storedFileName).normalize();
        Files.createDirectories(destination.getParent());
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        }

        SharedLibraryResource resource = SharedLibraryResource.builder()
                .title(title.trim())
                .description(StringUtils.hasText(description) ? description.trim() : "")
                .resourceType(resourceType)
                .fileName(storedFileName)
                .originalFileName(originalFileName)
                .filePath(destination.toAbsolutePath().toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(user.getUserId())
                .uploadedAt(LocalDateTime.now())
                .year(parsedYear)
                .semester(parsedSemester)
                .build();

        repository.save(resource);
        return map(resource);
    }

    @Override
    public List<SharedResourceResponseDTO> getAllResources() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "uploadedAt"))
                .stream()
                .map(this::map)
                .toList();
    }

    @Override
    public List<SharedResourceResponseDTO> getMyResources(Long userId) {
        return repository.findByUploadedByOrderByUploadedAtDesc(userId)
                .stream()
                .map(this::map)
                .toList();
    }

    @Override
    public List<SharedResourceResponseDTO> getResourcesByFilter(String year, String semester, String title, String resourceType) {
        List<Year> years = parseYears(year);
        List<Semester> semesters = parseSemesters(semester);
        String titleFilter = StringUtils.hasText(title) ? title.trim().toLowerCase() : null;
        ResourceType typeFilter = StringUtils.hasText(resourceType) ? parseResourceType(resourceType) : null;

        return repository.findAll(Sort.by(Sort.Direction.DESC, "uploadedAt"))
                .stream()
                .filter(resource -> years == null || years.contains(resource.getYear()))
                .filter(resource -> semesters == null || semesters.contains(resource.getSemester()))
                .filter(resource -> titleFilter == null || resource.getTitle().toLowerCase().contains(titleFilter))
                .filter(resource -> typeFilter == null || resource.getResourceType() == typeFilter)
                .map(this::map)
                .toList();
    }

    @Override
    public void deleteResource(Long resourceId, User user) {
        SharedLibraryResource resource = repository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        boolean isOwner = Objects.equals(resource.getUploadedBy(), user.getUserId());
        boolean isAdmin = user.getRole() == Role.ROLE_ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to delete this resource");
        }

        try {
            Files.deleteIfExists(Paths.get(resource.getFilePath()));
        } catch (IOException ignored) {
            // The database record should still be removable even if the file is already missing.
        }

        repository.delete(resource);
    }

    @Override
    public Optional<SharedLibraryResource> findById(Long resourceId) {
        return repository.findById(resourceId);
    }

    private SharedResourceResponseDTO map(SharedLibraryResource resource) {
        Optional<User> uploader = userRepo.findById(resource.getUploadedBy());
        String uploaderName = uploader
                .map(user -> (user.getFirstname() + " " + user.getLastName()).trim())
                .filter(StringUtils::hasText)
                .orElse("Unknown User");
        String uploaderRole = uploader.map(user -> user.getRole().name()).orElse(null);

        return SharedResourceResponseDTO.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .resourceType(resource.getResourceType().name())
                .originalFileName(resource.getOriginalFileName())
                .fileSize(resource.getFileSize())
                .contentType(resource.getContentType())
                .uploadedBy(resource.getUploadedBy())
                .uploaderName(uploaderName)
                .uploaderRole(uploaderRole)
                .uploadedAt(resource.getUploadedAt())
                .year(resource.getYear().name())
                .semester(resource.getSemester().name())
                .build();
    }

    private Year parseYear(String year) {
        try {
            return Year.valueOf(year.trim().toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid year value");
        }
    }

    private Semester parseSemester(String semester) {
        try {
            return Semester.valueOf(semester.trim().toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid semester value");
        }
    }

    private List<Year> parseYears(String year) {
        if (!StringUtils.hasText(year)) {
            return null;
        }
        try {
            return Arrays.stream(year.split(","))
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .map(value -> Year.valueOf(value.toUpperCase()))
                    .distinct()
                    .toList();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid year filter");
        }
    }

    private List<Semester> parseSemesters(String semester) {
        if (!StringUtils.hasText(semester)) {
            return null;
        }
        try {
            return Arrays.stream(semester.split(","))
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .map(value -> Semester.valueOf(value.toUpperCase()))
                    .distinct()
                    .toList();
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid semester filter");
        }
    }

    private ResourceType parseResourceType(String resourceType) {
        try {
            return ResourceType.valueOf(resourceType.trim().toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid resource type filter");
        }
    }

    private String sanitizeOriginalFileName(String originalFileName) {
        String candidate = StringUtils.hasText(originalFileName) ? StringUtils.cleanPath(originalFileName) : "resource";
        candidate = candidate.replace("\\", "/");
        candidate = candidate.substring(candidate.lastIndexOf('/') + 1).trim();
        return StringUtils.hasText(candidate) ? candidate : "resource";
    }

    private ResourceType determineResourceType(String fileName, String contentType) {
        String extension = "";
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot >= 0 && lastDot < fileName.length() - 1) {
            extension = fileName.substring(lastDot + 1).toLowerCase();
        }

        String normalizedContentType = contentType == null ? "" : contentType.toLowerCase();
        if (normalizedContentType.startsWith("video/") || VIDEO_EXTENSIONS.contains(extension)) {
            return ResourceType.VIDEO;
        }
        if ("application/pdf".equals(normalizedContentType) || "pdf".equals(extension)) {
            return ResourceType.PDF;
        }
        if (normalizedContentType.startsWith("text/")
                || normalizedContentType.contains("word")
                || normalizedContentType.contains("presentation")
                || normalizedContentType.contains("officedocument")
                || NOTE_EXTENSIONS.contains(extension)) {
            return ResourceType.NOTE;
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only video, PDF, and note files are supported");
    }
}
