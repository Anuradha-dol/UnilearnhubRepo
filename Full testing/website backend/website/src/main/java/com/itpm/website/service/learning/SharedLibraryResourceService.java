package com.itpm.website.service.learning;

import com.itpm.website.dtos.learning.SharedResourceResponseDTO;
import com.itpm.website.enities.User;
import com.itpm.website.enities.learning.SharedLibraryResource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface SharedLibraryResourceService {

    SharedResourceResponseDTO uploadResource(MultipartFile file,
                                             String title,
                                             String description,
                                             String year,
                                             String semester,
                                             User user) throws IOException;

    List<SharedResourceResponseDTO> getAllResources();

    List<SharedResourceResponseDTO> getMyResources(Long userId);

    List<SharedResourceResponseDTO> getResourcesByFilter(String year,
                                                         String semester,
                                                         String title,
                                                         String resourceType);

    void deleteResource(Long resourceId, User user);

    Optional<SharedLibraryResource> findById(Long resourceId);
}
