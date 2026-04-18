package com.itpm.website.service.learning;

import com.itpm.website.dtos.learning.QuizAttemptResponseDTO;
import com.itpm.website.dtos.learning.QuizSubmissionRequestDTO;
import com.itpm.website.dtos.learning.QuizSubmissionResultDTO;
import com.itpm.website.enities.learning.QuizQuestion;

import java.util.List;

public interface QuizService {
    QuizAttemptResponseDTO getQuizForLearner(Long videoId, Long userId);
    QuizSubmissionResultDTO submitQuiz(Long videoId, Long userId, QuizSubmissionRequestDTO request);
    List<QuizQuestion> getQuestionsByVideoIdForAdmin(Long videoId);
    QuizQuestion createQuestion(QuizQuestion question);

    QuizQuestion updateQuestion(Long id, QuizQuestion question);
    void deleteQuestion(Long id) throws IllegalStateException;
}
