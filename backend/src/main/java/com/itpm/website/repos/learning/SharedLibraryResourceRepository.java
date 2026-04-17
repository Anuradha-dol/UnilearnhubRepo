package com.itpm.website.repos.learning;

import com.itpm.website.dtos.learning.ResourceType;
import com.itpm.website.dtos.learning.Semester;
import com.itpm.website.dtos.learning.Year;
import com.itpm.website.enities.learning.SharedLibraryResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SharedLibraryResourceRepository extends JpaRepository<SharedLibraryResource, Long> {

    List<SharedLibraryResource> findByUploadedByOrderByUploadedAtDesc(Long userId);

    @Query("SELECT r FROM SharedLibraryResource r " +
            "WHERE (:title IS NULL OR LOWER(r.title) LIKE CONCAT('%', :title, '%')) " +
            "AND (:years IS NULL OR r.year IN :years) " +
            "AND (:semesters IS NULL OR r.semester IN :semesters) " +
            "AND (:resourceType IS NULL OR r.resourceType = :resourceType) " +
            "ORDER BY r.uploadedAt DESC")
    List<SharedLibraryResource> filterResources(@Param("title") String title,
                                                @Param("years") List<Year> years,
                                                @Param("semesters") List<Semester> semesters,
                                                @Param("resourceType") ResourceType resourceType);
}
