package com.itpm.website.repos.learning;

import com.itpm.website.enities.learning.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByVideoId(Long videoId); // fetch questions for a specific video
}

