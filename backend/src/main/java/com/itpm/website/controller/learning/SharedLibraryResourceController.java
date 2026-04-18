package com.itpm.website.controller.learning;

import com.itpm.website.dtos.learning.SharedResourceResponseDTO;
import com.itpm.website.enities.User;
import com.itpm.website.enities.learning.SharedLibraryResource;
import com.itpm.website.service.learning.SharedLibraryResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/shared-resources")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class SharedLibraryResourceController {

    private final SharedLibraryResourceService service;

    @PostMapping("/upload")
    public ResponseEntity<SharedResourceResponseDTO> upload(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String year,
            @RequestParam String semester
    ) throws IOException {
        SharedResourceResponseDTO dto = service.uploadResource(file, title, description, year, semester, user);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/all")
    public List<SharedResourceResponseDTO> all() {
        return service.getAllResources();
    }

    @GetMapping("/my")
    public List<SharedResourceResponseDTO> myResources(@AuthenticationPrincipal User user) {
        return service.getMyResources(user.getUserId());
    }

    @GetMapping("/filter")
    public ResponseEntity<List<SharedResourceResponseDTO>> filter(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String resourceType
    ) {
        return ResponseEntity.ok(service.getResourcesByFilter(year, semester, title, resourceType));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        service.deleteResource(id, user);
        return ResponseEntity.ok("Resource deleted successfully");
    }

    @GetMapping("/stream/{id}")
    public ResponseEntity<Resource> stream(@PathVariable Long id) throws IOException {
        SharedLibraryResource sharedResource = resolveResource(id);

        MediaType mediaType = resolveMediaType(sharedResource);
        String contentDisposition = sharedResource.getResourceType().name().equals("VIDEO")
                ? "inline"
                : "attachment";

        ResponseEntity.BodyBuilder response = ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        contentDisposition + "; filename=\"" + sharedResource.getOriginalFileName() + "\"");

        if (sharedResource.getFileSize() != null) {
            response.contentLength(sharedResource.getFileSize());
        }

        return response.body(new UrlResource(Paths.get(sharedResource.getFilePath()).toUri()));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws IOException {
        SharedLibraryResource sharedResource = resolveResource(id);
        Resource resource = new UrlResource(Paths.get(sharedResource.getFilePath()).toUri());
        MediaType mediaType = resolveMediaType(sharedResource);

        ResponseEntity.BodyBuilder response = ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + sharedResource.getOriginalFileName() + "\"");

        if (sharedResource.getFileSize() != null) {
            response.contentLength(sharedResource.getFileSize());
        }

        return response.body(resource);
    }

    private SharedLibraryResource resolveResource(Long id) {
        SharedLibraryResource sharedResource = service.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));

        Path filePath = Paths.get(sharedResource.getFilePath());
        if (!Files.exists(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }

        return sharedResource;
    }

    private MediaType resolveMediaType(SharedLibraryResource sharedResource) throws IOException {
        Path filePath = Paths.get(sharedResource.getFilePath());
        String contentType = Files.probeContentType(filePath);
        if (contentType == null || contentType.isBlank()) {
            contentType = sharedResource.getContentType();
        }

        try {
            return contentType == null || contentType.isBlank()
                    ? MediaType.APPLICATION_OCTET_STREAM
                    : MediaType.parseMediaType(contentType);
        } catch (Exception ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
