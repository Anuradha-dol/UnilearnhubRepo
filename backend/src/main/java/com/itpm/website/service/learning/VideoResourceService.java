package com.itpm.website.service.learning;

import com.itpm.website.dtos.learning.VideoResponseDTO;
import com.itpm.website.enities.learning.VideoResource;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface VideoResourceService {

    VideoResponseDTO uploadVideo(MultipartFile file, String title, String description, String year, String semester, String academicYear, Long userId) throws IOException;

    List<VideoResponseDTO> getAllVideos();

    List<VideoResponseDTO> getVideosByUser(Long userId);

    List<VideoResponseDTO> getVideosByFilter(String year, String semester, String title, String academicYear);

    VideoResponseDTO updateVideo(Long id, String title, String description, String year, String semester, String academicYear, Long userId);

    void deleteVideo(Long id, Long userId);

    Resource streamVideo(Long id);

    List<VideoResource> findByYearAndSemester(String year, String semester);

    List<VideoResource> findByTitleContainingIgnoreCaseAndYear(String title, String year);

    Optional<VideoResource> findById(Long id);
}
