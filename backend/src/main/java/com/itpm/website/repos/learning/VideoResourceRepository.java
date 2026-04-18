package com.itpm.website.repos.learning;

import com.itpm.website.dtos.learning.Semester;
import com.itpm.website.dtos.learning.Year;
import com.itpm.website.enities.learning.VideoResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VideoResourceRepository extends JpaRepository<VideoResource, Long> {


    List<VideoResource> findByUploadedBy(Long userId);


    @Query("SELECT v FROM VideoResource v " +
            "WHERE (:title IS NULL OR LOWER(v.title) LIKE CONCAT('%', :title, '%')) " +
            "AND (:academicYear IS NULL OR v.academicYear = :academicYear) " +
            "AND (:years IS NULL OR v.year IN :years) " +
            "AND (:semesters IS NULL OR v.semester IN :semesters)")
    List<VideoResource> filterVideos(@Param("title") String title,
                                     @Param("academicYear") String academicYear,
                                     @Param("years") List<Year> years,
                                     @Param("semesters") List<Semester> semesters);

    // Optional convenience methods
    List<VideoResource> findByYearAndSemester(String year, String semester);
    List<VideoResource> findByTitleContainingIgnoreCaseAndYear(String title, String year);
}
