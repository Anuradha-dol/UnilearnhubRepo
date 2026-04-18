package com.itpm.website.repos.problemsreview;

import com.itpm.website.enities.problemsreview.SupportQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportRepository extends JpaRepository<SupportQuestion, Long> {

    List<SupportQuestion> findByUserId(Long userId);
}

