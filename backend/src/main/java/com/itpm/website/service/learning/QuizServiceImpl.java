package com.itpm.website.service.learning;

import com.itpm.website.dtos.learning.LearnerQuizQuestionDTO;
import com.itpm.website.dtos.learning.QuizAttemptResponseDTO;
import com.itpm.website.dtos.learning.QuizQuestionResultDTO;
import com.itpm.website.dtos.learning.QuizSubmissionRequestDTO;
import com.itpm.website.dtos.learning.QuizSubmissionResultDTO;
import com.itpm.website.enities.learning.QuizQuestion;
import com.itpm.website.enities.learning.UserVideoQuizAssignment;
import com.itpm.website.repos.learning.QuizQuestionRepository;
import com.itpm.website.repos.learning.UserVideoQuizAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private static final String DEFAULT_QUIZ_SET = "Quiz 1";
    private final QuizQuestionRepository repository;
    private final UserVideoQuizAssignmentRepository assignmentRepository;

    @Override
    public QuizAttemptResponseDTO getQuizForLearner(Long videoId, Long userId) {
        List<QuizQuestion> questions = new ArrayList<>(repository.findByVideoId(videoId));
        if (questions.isEmpty()) {
            return QuizAttemptResponseDTO.builder()
                    .videoId(videoId)
                    .quizSet("")
                    .questionCount(0)
                    .questions(List.of())
                    .build();
        }

        Map<String, List<QuizQuestion>> questionsBySet = groupQuestionsBySet(questions);
        String assignedQuizSet = resolveAssignedQuizSet(videoId, userId, questionsBySet);
        List<QuizQuestion> assignedQuestions = new ArrayList<>(questionsBySet.getOrDefault(assignedQuizSet, List.of()));
        Collections.shuffle(assignedQuestions);

        return QuizAttemptResponseDTO.builder()
                .videoId(videoId)
                .quizSet(assignedQuizSet)
                .questionCount(assignedQuestions.size())
                .questions(assignedQuestions.stream().map(this::toLearnerQuestion).toList())
                .build();
    }

    @Override
    public QuizSubmissionResultDTO submitQuiz(Long videoId, Long userId, QuizSubmissionRequestDTO request) {
        List<QuizQuestion> questions = new ArrayList<>(repository.findByVideoId(videoId));
        if (questions.isEmpty()) {
            return QuizSubmissionResultDTO.builder()
                    .videoId(videoId)
                    .quizSet("")
                    .score(0)
                    .total(0)
                    .details(List.of())
                    .build();
        }

        Map<String, List<QuizQuestion>> questionsBySet = groupQuestionsBySet(questions);
        String assignedQuizSet = resolveAssignedQuizSet(videoId, userId, questionsBySet);
        List<QuizQuestion> assignedQuestions = questionsBySet.getOrDefault(assignedQuizSet, List.of());
        Map<String, String> submittedAnswers = request == null || request.getAnswers() == null
                ? Map.of()
                : request.getAnswers();

        List<QuizQuestionResultDTO> details = assignedQuestions.stream()
                .map(question -> buildQuestionResult(question, submittedAnswers))
                .toList();

        int score = (int) details.stream().filter(QuizQuestionResultDTO::isCorrect).count();

        return QuizSubmissionResultDTO.builder()
                .videoId(videoId)
                .quizSet(assignedQuizSet)
                .score(score)
                .total(assignedQuestions.size())
                .details(details)
                .build();
    }

    @Override
    public List<QuizQuestion> getQuestionsByVideoIdForAdmin(Long videoId) {
        return repository.findByVideoId(videoId).stream()
                .map(this::copyWithNormalizedQuizSet)
                .sorted(
                        Comparator.comparing((QuizQuestion q) -> normalizeQuizSet(q.getQuizSet()))
                                .thenComparing(q -> q.getId() == null ? Long.MAX_VALUE : q.getId())
                )
                .toList();
    }

    @Override
    public QuizQuestion createQuestion(QuizQuestion question) {
        return repository.save(prepareQuestionForSave(question));
    }

    @Override
    public QuizQuestion updateQuestion(Long id, QuizQuestion updatedQuestion) {
        Optional<QuizQuestion> existing = repository.findById(id);
        if (existing.isPresent()) {
            QuizQuestion q = existing.get();
            QuizQuestion prepared = prepareQuestionForSave(updatedQuestion);
            q.setQuestion(prepared.getQuestion());
            q.setOptions(prepared.getOptions());
            q.setCorrectAnswer(prepared.getCorrectAnswer());
            q.setVideoId(prepared.getVideoId());
            q.setQuizSet(prepared.getQuizSet());
            return repository.save(q);
        } else {
            throw new IllegalStateException("Quiz question not found with id " + id);
        }
    }

    @Override
    public void deleteQuestion(Long id) throws IllegalStateException {
        try {
            repository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Cannot delete quiz question. It may be referenced elsewhere.");
        }
    }

    private QuizQuestion copyWithShuffledOptions(QuizQuestion question) {
        List<String> shuffledOptions = question.getOptions() == null
                ? new ArrayList<>()
                : new ArrayList<>(question.getOptions());

        Collections.shuffle(shuffledOptions);

        return QuizQuestion.builder()
                .id(question.getId())
                .videoId(question.getVideoId())
                .quizSet(normalizeQuizSet(question.getQuizSet()))
                .question(question.getQuestion())
                .options(shuffledOptions)
                .correctAnswer(question.getCorrectAnswer())
                .build();
    }

    private LearnerQuizQuestionDTO toLearnerQuestion(QuizQuestion question) {
        QuizQuestion shuffledQuestion = copyWithShuffledOptions(question);
        return LearnerQuizQuestionDTO.builder()
                .id(shuffledQuestion.getId())
                .question(shuffledQuestion.getQuestion())
                .options(shuffledQuestion.getOptions())
                .build();
    }

    private QuizQuestion copyWithNormalizedQuizSet(QuizQuestion question) {
        return QuizQuestion.builder()
                .id(question.getId())
                .videoId(question.getVideoId())
                .quizSet(normalizeQuizSet(question.getQuizSet()))
                .question(question.getQuestion())
                .options(question.getOptions() == null ? List.of() : new ArrayList<>(question.getOptions()))
                .correctAnswer(question.getCorrectAnswer())
                .build();
    }

    private QuizQuestionResultDTO buildQuestionResult(QuizQuestion question, Map<String, String> submittedAnswers) {
        String userAnswer = normalizeAnswer(submittedAnswers.get(String.valueOf(question.getId())));
        String correctAnswer = normalizeAnswer(question.getCorrectAnswer());
        boolean isCorrect = StringUtils.hasText(userAnswer) && userAnswer.equals(correctAnswer);

        return QuizQuestionResultDTO.builder()
                .questionId(question.getId())
                .question(question.getQuestion())
                .userAnswer(StringUtils.hasText(userAnswer) ? userAnswer : null)
                .correctAnswer(correctAnswer)
                .correct(isCorrect)
                .build();
    }

    private Map<String, List<QuizQuestion>> groupQuestionsBySet(List<QuizQuestion> questions) {
        return questions.stream()
                .map(this::copyWithNormalizedQuizSet)
                .collect(Collectors.groupingBy(
                        question -> normalizeQuizSet(question.getQuizSet()),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    private String resolveAssignedQuizSet(Long videoId, Long userId, Map<String, List<QuizQuestion>> questionsBySet) {
        Optional<UserVideoQuizAssignment> existingAssignment = assignmentRepository.findByUserIdAndVideoId(userId, videoId);

        if (existingAssignment.isPresent()) {
            String normalizedQuizSet = normalizeQuizSet(existingAssignment.get().getQuizSet());
            if (questionsBySet.containsKey(normalizedQuizSet)) {
                return normalizedQuizSet;
            }
        }

        String assignedQuizSet = chooseLeastUsedQuizSet(videoId, questionsBySet.keySet());
        UserVideoQuizAssignment assignment = existingAssignment.orElseGet(UserVideoQuizAssignment::new);
        assignment.setUserId(userId);
        assignment.setVideoId(videoId);
        assignment.setQuizSet(assignedQuizSet);
        assignment.setAssignedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        return assignedQuizSet;
    }

    private String chooseLeastUsedQuizSet(Long videoId, Set<String> availableQuizSets) {
        List<UserVideoQuizAssignment> assignments = assignmentRepository.findByVideoId(videoId);
        Map<String, Long> usageCountBySet = assignments.stream()
                .collect(Collectors.groupingBy(
                        assignment -> normalizeQuizSet(assignment.getQuizSet()),
                        Collectors.counting()
                ));

        long lowestUsage = availableQuizSets.stream()
                .mapToLong(quizSet -> usageCountBySet.getOrDefault(quizSet, 0L))
                .min()
                .orElse(0L);

        List<String> candidates = availableQuizSets.stream()
                .filter(quizSet -> usageCountBySet.getOrDefault(quizSet, 0L) == lowestUsage)
                .collect(Collectors.toCollection(ArrayList::new));

        Collections.shuffle(candidates);
        return candidates.get(0);
    }

    private QuizQuestion prepareQuestionForSave(QuizQuestion question) {
        if (question == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz question is required");
        }

        if (question.getVideoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Video ID is required");
        }

        String normalizedQuestion = normalizeRequiredText(question.getQuestion(), "Question is required");
        List<String> normalizedOptions = normalizeOptions(question.getOptions());
        String normalizedCorrectAnswer = normalizeRequiredText(question.getCorrectAnswer(), "Correct answer is required");

        if (!normalizedOptions.contains(normalizedCorrectAnswer)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correct answer must match one of the options");
        }

        question.setQuizSet(normalizeQuizSet(question.getQuizSet()));
        question.setQuestion(normalizedQuestion);
        question.setOptions(normalizedOptions);
        question.setCorrectAnswer(normalizedCorrectAnswer);
        return question;
    }

    private List<String> normalizeOptions(List<String> options) {
        if (options == null || options.size() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least two options are required");
        }

        List<String> normalizedOptions = options.stream()
                .map(option -> normalizeRequiredText(option, "Options cannot be empty"))
                .toList();

        long uniqueCount = normalizedOptions.stream().distinct().count();
        if (uniqueCount != normalizedOptions.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Options must be unique");
        }

        return normalizedOptions;
    }

    private String normalizeRequiredText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String normalizeAnswer(String answer) {
        return StringUtils.hasText(answer) ? answer.trim() : null;
    }

    private String normalizeQuizSet(String quizSet) {
        if (!StringUtils.hasText(quizSet)) {
            return DEFAULT_QUIZ_SET;
        }
        return quizSet.trim();
    }
}
