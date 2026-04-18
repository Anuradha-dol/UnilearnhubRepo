package com.itpm.website.controller.learning;

import com.itpm.website.dtos.learning.VideoResponseDTO;
import com.itpm.website.enities.User;
import com.itpm.website.enities.learning.VideoResource;
import com.itpm.website.service.learning.VideoResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoResourceController {

    private final VideoResourceService service;


    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/upload")
    public ResponseEntity<VideoResponseDTO> upload(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String year,
            @RequestParam String semester,
            @RequestParam String academicYear
    ) throws IOException {
        VideoResponseDTO dto = service.uploadVideo(file, title, description, year, semester, academicYear, user.getUserId());
        return ResponseEntity.ok(dto);
    }


    @PreAuthorize("isAuthenticated()")
    @GetMapping("/all")
    public List<VideoResponseDTO> all() {
        return service.getAllVideos();
    }


    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/my")
    public List<VideoResponseDTO> myVideos(@AuthenticationPrincipal User user) {
        return service.getVideosByUser(user.getUserId());
    }


    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<VideoResponseDTO> update(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String year,
            @RequestParam String semester,
            @RequestParam String academicYear,
            @AuthenticationPrincipal User user
    ) {
        VideoResponseDTO dto = service.updateVideo(id, title, description, year, semester, academicYear, user.getUserId());
        return ResponseEntity.ok(dto);
    }


    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        service.deleteVideo(id, user.getUserId());
        return ResponseEntity.ok("Video deleted successfully");
    }


    @GetMapping("/stream/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> streamVideo(@PathVariable Long id) throws IOException {
        Optional<VideoResource> optionalVideo = service.findById(id);
        if (optionalVideo.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        VideoResource video = optionalVideo.get();
        Path path = Paths.get(video.getFilePath());
        if (!Files.exists(path)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(path.toUri());


        String contentType = Files.probeContentType(path);
        if (contentType == null) contentType = "video/mp4";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + video.getFileName() + "\"")
                .body(resource);
    }


    @PreAuthorize("isAuthenticated()")
    @GetMapping("/filter")
    public ResponseEntity<List<VideoResponseDTO>> filter(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String academicYear
    ) {
        List<VideoResponseDTO> videos = service.getVideosByFilter(year, semester, title, academicYear);
        return ResponseEntity.ok(videos);
    }
}
