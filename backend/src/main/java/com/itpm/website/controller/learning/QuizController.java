package com.itpm.website.controller.learning;


import com.itpm.website.dtos.learning.QuizAttemptResponseDTO;
import com.itpm.website.dtos.learning.QuizSubmissionRequestDTO;
import com.itpm.website.dtos.learning.QuizSubmissionResultDTO;
import com.itpm.website.enities.User;
import com.itpm.website.enities.learning.QuizQuestion;
import com.itpm.website.service.learning.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService service;

    @GetMapping("/{videoId}")
    public QuizAttemptResponseDTO getQuiz(@PathVariable Long videoId,
                                          @AuthenticationPrincipal User user) {
        return service.getQuizForLearner(videoId, user.getUserId());
    }

    @PostMapping("/{videoId}/submit")
    public QuizSubmissionResultDTO submitQuiz(@PathVariable Long videoId,
                                              @AuthenticationPrincipal User user,
                                              @RequestBody QuizSubmissionRequestDTO request) {
        return service.submitQuiz(videoId, user.getUserId(), request);
    }

    @GetMapping("/admin/{videoId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<QuizQuestion> getQuizForAdmin(@PathVariable Long videoId) {
        return service.getQuestionsByVideoIdForAdmin(videoId);
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public QuizQuestion createQuestion(@RequestBody QuizQuestion question) {
        return service.createQuestion(question);
    }


    @PutMapping("/update/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public QuizQuestion updateQuestion(@PathVariable Long id, @RequestBody QuizQuestion question) {
        return service.updateQuestion(id, question);
    }


    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteQuestion(@PathVariable Long id) {
        try {
            service.deleteQuestion(id);
            return "Quiz question deleted successfully!";
        } catch (IllegalStateException e) {
            return e.getMessage();
        }
    }
}
