package com.itpm.website.controller.task;

import com.itpm.website.dtos.task.*;
import com.itpm.website.enities.User;
import com.itpm.website.service.task.TaskGamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks/games")
@RequiredArgsConstructor
public class TaskGameController {

    private final TaskGamificationService taskGamificationService;

    @PostMapping("/{feature}/session")
    public ResponseEntity<GameSessionResponse> startSession(
            @PathVariable GameFeatureType feature,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskGamificationService.startSession(currentUser, feature));
    }

    @GetMapping("/subject-quiz")
    public ResponseEntity<List<QuizQuestionDto>> getSubjectQuiz(
            @RequestParam GameFeatureType feature,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskGamificationService.getQuizQuestions(currentUser, feature));
    }

    @PostMapping("/subject-quiz/submit")
    public ResponseEntity<QuizResultDto> submitSubjectQuiz(
            @RequestParam GameFeatureType feature,
            @RequestBody QuizSubmissionRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskGamificationService.submitQuiz(currentUser, feature, request));
    }

    @GetMapping("/business-simulation")
    public ResponseEntity<BusinessScenarioDto> getBusinessScenario(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskGamificationService.getBusinessScenario(currentUser));
    }

    @PostMapping("/business-simulation/submit")
    public ResponseEntity<BusinessDecisionResultDto> submitBusinessDecision(
            @RequestBody BusinessDecisionRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(taskGamificationService.submitBusinessDecision(currentUser, request));
    }
}
