package com.itpm.website.service.task;

import com.itpm.website.dtos.task.*;
import com.itpm.website.enities.User;
import com.itpm.website.enities.task.GameUnlock;
import com.itpm.website.enities.task.MainTask;
import com.itpm.website.enities.task.Notifications;
import com.itpm.website.enities.task.Progress;
import com.itpm.website.enities.task.Reward;
import com.itpm.website.repos.task.GameUnlockRepository;
import com.itpm.website.repos.task.NotificationRepository;
import com.itpm.website.repos.task.ProgressRepository;
import com.itpm.website.repos.task.RewardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskGamificationService {
    private static final int SESSION_MINUTES = 10;
    private static final int XP_PER_LEVEL = 100;

    private static final List<UnlockDefinition> UNLOCK_DEFINITIONS = List.of(
            new UnlockDefinition(GameFeatureType.MINI_GAME, 3, 120, "Mini Puzzle Game", "Unlock after reaching 120 XP."),
            new UnlockDefinition(GameFeatureType.BUSINESS_QUIZ_GAME, 5, 250, "Business Strategy Game", "Unlock after reaching 250 XP."),
            new UnlockDefinition(GameFeatureType.ADVANCED_GAME, 10, 500, "Advanced Puzzle Game", "Unlock after reaching 500 XP.")
    );

    private static final Map<GameFeatureType, List<QuestionSeed>> SUBJECT_QUESTIONS = Map.of(
            GameFeatureType.MINI_GAME, List.of(
                    new QuestionSeed(1L, "Puzzle 1: which Java keyword completes the inheritance rule?", List.of("extends", "implements", "inherits", "super"), 0),
                    new QuestionSeed(2L, "Puzzle 2: which SQL clause solves grouped filtering?", List.of("ORDER BY", "GROUP BY", "HAVING", "WHERE"), 2),
                    new QuestionSeed(3L, "Puzzle 3: what does JVM stand for?", List.of("Java Variable Method", "Java Virtual Machine", "Joint Visual Model", "Java Vendor Module"), 1),
                    new QuestionSeed(4L, "Puzzle 4: which collection keeps only unique values?", List.of("ArrayList", "HashMap", "HashSet", "LinkedList"), 2)
            ),
            GameFeatureType.ADVANCED_GAME, List.of(
                    new QuestionSeed(101L, "Advanced puzzle 1: which Spring annotation creates a transactional boundary?", List.of("@Service", "@Transactional", "@ComponentScan", "@Bean"), 1),
                    new QuestionSeed(102L, "Advanced puzzle 2: which SQL join returns only matching rows?", List.of("LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "INNER JOIN"), 3),
                    new QuestionSeed(103L, "Advanced puzzle 3: what is the key benefit of dependency injection?", List.of("Faster CPU speed", "Loose coupling", "Automatic SQL indexes", "Smaller binaries"), 1),
                    new QuestionSeed(104L, "Advanced puzzle 4: which HTTP status fits a locked feature request?", List.of("200", "302", "403", "500"), 2)
            )
    );

    private static final List<BusinessScenarioSeed> BUSINESS_SCENARIOS = List.of(
            new BusinessScenarioSeed(1L, "Launch Week Budget", "You have a limited launch budget. Which strategy do you choose for Uni Learn Hub?", List.of(
                    new BusinessOutcome("A", "Split budget between ads, support, and retention", "Balanced approach", 95, 35, "Strong retention and stable growth."),
                    new BusinessOutcome("B", "Spend all budget on ads", "Fast exposure", 70, 20, "Traffic spikes, but churn increases."),
                    new BusinessOutcome("C", "Save the budget and do nothing", "Low risk", 40, 5, "Costs stay low, but growth stalls.")
            )),
            new BusinessScenarioSeed(2L, "Team Capacity", "Your team can either build a new feature or fix current bugs. What do you do?", List.of(
                    new BusinessOutcome("A", "Fix key bugs first, then ship the feature", "Quality first", 100, 40, "User trust rises and adoption improves."),
                    new BusinessOutcome("B", "Ship the feature immediately", "Speed first", 65, 15, "The launch is fast, but support tickets increase."),
                    new BusinessOutcome("C", "Pause both tasks", "Avoid change", 35, 5, "Momentum drops and engagement slows.")
            )),
            new BusinessScenarioSeed(3L, "Student Feedback", "Students want both a leaderboard and calmer study reminders. Which path do you pick?", List.of(
                    new BusinessOutcome("A", "Add both with clear controls", "User-centered", 92, 30, "Engagement improves without overwhelming users."),
                    new BusinessOutcome("B", "Add leaderboard only", "Competition first", 68, 15, "Some users enjoy it, others feel pressure."),
                    new BusinessOutcome("C", "Ignore the feedback", "No change", 30, 0, "Students feel unheard and activity drops.")
            ))
    );

    private final ProgressRepository progressRepository;
    private final RewardRepository rewardRepository;
    private final GameUnlockRepository gameUnlockRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public void ensurePlayerProfile(User user) {
        getOrCreateProgress(user);
        ensureUnlocks(user);
    }

    @Transactional
    public Progress getOrCreateProgress(User user) {
        return progressRepository.findByUserUserId(user.getUserId()).orElseGet(() ->
                progressRepository.save(Progress.builder().user(user).build())
        );
    }

    @Transactional
    public TaskDashboardResponse buildDashboard(User user) {
        Progress progress = getOrCreateProgress(user);
        List<GameUnlock> unlocks = evaluateUnlocks(user, progress);
        List<RewardSummaryDto> recentRewards = rewardRepository.findTop5ByUserUserIdOrderByCreatedAtDesc(user.getUserId())
                .stream().map(this::toRewardDto).toList();
        List<String> badges = rewardRepository.findByUserUserIdAndRewardTypeOrderByCreatedAtDesc(user.getUserId(), RewardType.BADGE)
                .stream().map(Reward::getTitle).distinct().toList();

        int level = calculateLevel(progress.getXpPoints());
        progress.setLevel(level);
        progress.setUpdatedAt(LocalDateTime.now());
        progressRepository.save(progress);

        return TaskDashboardResponse.builder()
                .xpPoints(progress.getXpPoints())
                .completedTasks(progress.getCompletedTasks())
                .level(level)
                .nextLevelXp(level * XP_PER_LEVEL)
                .levelProgress(calculateLevelProgress(progress.getXpPoints()))
                .badges(badges)
                .unlocks(unlocks.stream().map(this::toUnlockDto).toList())
                .recentRewards(recentRewards)
                .build();
    }

    @Transactional
    public void handleTaskCompletion(User user, MainTask task) {
        if (task.isRewardGranted()) return;

        Progress progress = getOrCreateProgress(user);
        int earnedXp = resolveTaskXp(task);

        progress.setCompletedTasks(progress.getCompletedTasks() + 1);
        progress.setXpPoints(progress.getXpPoints() + earnedXp);
        progress.setLevel(calculateLevel(progress.getXpPoints()));
        progress.setUpdatedAt(LocalDateTime.now());

        task.setRewardGranted(true);
        if (task.getCompletedAt() == null) task.setCompletedAt(LocalDateTime.now());

        progressRepository.save(progress);
        rewardRepository.save(Reward.builder()
                .user(user)
                .task(task)
                .rewardType(RewardType.TASK_COMPLETION)
                .code("TASK_COMPLETION_" + task.getId())
                .title("Task Completed")
                .description("Completed '" + task.getTitle() + "'")
                .xpAwarded(earnedXp)
                .build());
        createNotification(user, "Task completed: +" + earnedXp + " XP for '" + task.getTitle() + "'.");

        awardBadgeIfMissing(user, progress, task, "TASK_MASTER", "Task Master", "Completed 3 tasks in Uni Learn Hub.", progress.getCompletedTasks() >= 3, 25);
        boolean quickFinisher = task.getEndDate() != null && task.getCompletedAt() != null && !task.getCompletedAt().toLocalDate().isAfter(task.getEndDate());
        awardBadgeIfMissing(user, progress, task, "QUICK_FINISHER", "Quick Finisher", "Completed a task before the deadline.", quickFinisher, 15);
        awardBadgeIfMissing(user, progress, task, "FOCUS_LEGEND", "Focus Legend", "Completed 10 tasks and unlocked advanced focus mode.", progress.getCompletedTasks() >= 10, 50);

        progress.setLevel(calculateLevel(progress.getXpPoints()));
        progress.setUpdatedAt(LocalDateTime.now());
        progressRepository.save(progress);
        evaluateUnlocks(user, progress);
    }

    @Transactional
    public void handleTaskReopened(User user, MainTask task) {
        boolean hadCompletionTimestamp = task.getCompletedAt() != null;
        task.setCompletedAt(null);

        // Remove completion reward row first; fallback to completion timestamp for older data states.
        long removedCompletionRewards = task.getId() == null
                ? 0
                : rewardRepository.deleteByTask_IdAndRewardType(task.getId(), RewardType.TASK_COMPLETION);
        int rollbackUnits = (int) Math.max(removedCompletionRewards, hadCompletionTimestamp ? 1 : 0);
        if (rollbackUnits <= 0) return;

        Progress progress = getOrCreateProgress(user);
        int deductedXp = resolveTaskXp(task) * rollbackUnits;

        progress.setCompletedTasks(Math.max(0, progress.getCompletedTasks() - rollbackUnits));
        progress.setXpPoints(Math.max(0, progress.getXpPoints() - deductedXp));
        progress.setLevel(calculateLevel(progress.getXpPoints()));
        progress.setUpdatedAt(LocalDateTime.now());
        task.setRewardGranted(true);

        progressRepository.save(progress);
        createNotification(user, "Task reopened: -" + deductedXp + " XP for '" + task.getTitle() + "'.");
        evaluateUnlocks(user, progress);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard() {
        List<Progress> topProgress = progressRepository.findTop10ByOrderByXpPointsDescCompletedTasksDesc();
        List<LeaderboardEntryDto> leaderboard = new java.util.ArrayList<>();
        int rank = 1;
        for (Progress progress : topProgress) {
            User boardUser = progress.getUser();
            leaderboard.add(LeaderboardEntryDto.builder()
                    .rank(rank++)
                    .userId(boardUser.getUserId())
                    .fullName((boardUser.getFirstname() + " " + boardUser.getLastName()).trim())
                    .xpPoints(progress.getXpPoints())
                    .completedTasks(progress.getCompletedTasks())
                    .level(calculateLevel(progress.getXpPoints()))
                    .build());
        }
        return leaderboard;
    }

    @Transactional
    public GameSessionResponse startSession(User user, GameFeatureType feature) {
        Progress progress = getOrCreateProgress(user);
        evaluateUnlocks(user, progress);
        GameUnlock unlock = getUnlock(user, feature);
        if (!unlock.isUnlocked()) throw new RuntimeException("Locked - Complete more tasks to unlock.");

        LocalDateTime now = LocalDateTime.now();
        if (unlock.getSessionExpiresAt() == null || !unlock.getSessionExpiresAt().isAfter(now)) {
            unlock.setSessionStartedAt(now);
            unlock.setSessionExpiresAt(now.plusMinutes(SESSION_MINUTES));
            gameUnlockRepository.save(unlock);
        }

        return GameSessionResponse.builder()
                .feature(feature)
                .expiresAt(unlock.getSessionExpiresAt())
                .remainingSeconds(Duration.between(now, unlock.getSessionExpiresAt()).getSeconds())
                .message("Relax mode active for " + SESSION_MINUTES + " minutes.")
                .build();
    }

    @Transactional(readOnly = true)
    public List<QuizQuestionDto> getQuizQuestions(User user, GameFeatureType feature) {
        if (feature == GameFeatureType.BUSINESS_QUIZ_GAME) throw new RuntimeException("Use the business simulation endpoint for this feature.");
        requireActiveSession(user, feature);
        return SUBJECT_QUESTIONS.getOrDefault(feature, List.of()).stream()
                .map(question -> QuizQuestionDto.builder().questionId(question.id()).prompt(question.prompt()).options(question.options()).build())
                .toList();
    }

    @Transactional
    public QuizResultDto submitQuiz(User user, GameFeatureType feature, QuizSubmissionRequest request) {
        if (feature == GameFeatureType.BUSINESS_QUIZ_GAME) throw new RuntimeException("Use the business simulation endpoint for this feature.");

        GameUnlock unlock = requireActiveSession(user, feature);
        List<QuestionSeed> questions = SUBJECT_QUESTIONS.getOrDefault(feature, List.of());
        Map<Long, Integer> submittedAnswers = (request.getAnswers() == null ? List.<QuizAnswerDto>of() : request.getAnswers()).stream()
                .filter(answer -> answer.getQuestionId() != null && answer.getSelectedOption() != null)
                .collect(Collectors.toMap(QuizAnswerDto::getQuestionId, QuizAnswerDto::getSelectedOption, (left, right) -> right));

        int score = 0;
        for (QuestionSeed question : questions) {
            if (question.correctOption() == submittedAnswers.getOrDefault(question.id(), -1)) score++;
        }

        int xpBonus = alreadyRewardedThisSession(unlock) ? 0 : calculateQuizBonus(feature, score, questions.size());
        if (xpBonus > 0) {
            awardGameBonus(user, unlock, RewardType.QUIZ_BONUS, "Quiz Bonus", "Scored " + score + "/" + questions.size() + " in the subject quiz.", xpBonus);
        }

        return QuizResultDto.builder()
                .score(score)
                .totalQuestions(questions.size())
                .xpBonus(xpBonus)
                .feedback(score == questions.size() ? "Perfect score. Bonus XP awarded." : "Session complete. Review the topics and return to your tasks.")
                .sessionExpiresAt(unlock.getSessionExpiresAt())
                .build();
    }

    @Transactional(readOnly = true)
    public BusinessScenarioDto getBusinessScenario(User user) {
        requireActiveSession(user, GameFeatureType.BUSINESS_QUIZ_GAME);
        BusinessScenarioSeed scenario = BUSINESS_SCENARIOS.get(ThreadLocalRandom.current().nextInt(BUSINESS_SCENARIOS.size()));
        return toBusinessScenarioDto(scenario);
    }

    @Transactional
    public BusinessDecisionResultDto submitBusinessDecision(User user, BusinessDecisionRequest request) {
        GameUnlock unlock = requireActiveSession(user, GameFeatureType.BUSINESS_QUIZ_GAME);
        BusinessScenarioSeed scenario = BUSINESS_SCENARIOS.stream()
                .filter(item -> item.id().equals(request.getScenarioId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Business scenario not found"));

        BusinessOutcome selectedOutcome = scenario.outcomes().stream()
                .filter(outcome -> outcome.optionId().equalsIgnoreCase(request.getOptionId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Business option not found"));

        int xpBonus = alreadyRewardedThisSession(unlock) ? 0 : selectedOutcome.xpBonus();
        if (xpBonus > 0) {
            awardGameBonus(user, unlock, RewardType.BUSINESS_DECISION, "Business Strategy Bonus", "Handled '" + scenario.title() + "' with a score of " + selectedOutcome.score() + ".", xpBonus);
        }

        return BusinessDecisionResultDto.builder()
                .score(selectedOutcome.score())
                .xpBonus(xpBonus)
                .result(selectedOutcome.result())
                .recommendation(selectedOutcome.hint())
                .sessionExpiresAt(unlock.getSessionExpiresAt())
                .build();
    }

    private List<GameUnlock> ensureUnlocks(User user) {
        List<GameUnlock> currentUnlocks = gameUnlockRepository.findByUserUserIdOrderByRequiredTasksAsc(user.getUserId());
        for (UnlockDefinition definition : UNLOCK_DEFINITIONS) {
            boolean exists = currentUnlocks.stream().anyMatch(unlock -> unlock.getFeature() == definition.feature());
            if (!exists) {
                currentUnlocks.add(gameUnlockRepository.save(GameUnlock.builder()
                        .user(user)
                        .feature(definition.feature())
                        .requiredTasks(definition.requiredTasks())
                        .requiredXp(definition.requiredXp())
                        .build()));
            }
        }
        return gameUnlockRepository.findByUserUserIdOrderByRequiredTasksAsc(user.getUserId());
    }

    private List<GameUnlock> evaluateUnlocks(User user, Progress progress) {
        List<GameUnlock> unlocks = ensureUnlocks(user);
        LocalDateTime now = LocalDateTime.now();
        for (GameUnlock unlock : unlocks) {
            boolean shouldUnlock = meetsUnlockRequirements(progress, unlock);
            if (unlock.isUnlocked() == shouldUnlock) {
                continue;
            }

            unlock.setUnlocked(shouldUnlock);
            if (shouldUnlock) {
                unlock.setUnlockedAt(now);
                gameUnlockRepository.save(unlock);
                createNotification(user, unlockTitle(unlock.getFeature()) + " unlocked. Relax mode is available for 10 minutes per session.");
                continue;
            }

            unlock.setUnlockedAt(null);
            unlock.setSessionStartedAt(null);
            unlock.setSessionExpiresAt(null);
            gameUnlockRepository.save(unlock);
        }
        return gameUnlockRepository.findByUserUserIdOrderByRequiredTasksAsc(user.getUserId());
    }

    private GameUnlock getUnlock(User user, GameFeatureType feature) {
        ensureUnlocks(user);
        return gameUnlockRepository.findByUserUserIdAndFeature(user.getUserId(), feature)
                .orElseThrow(() -> new RuntimeException("Game unlock not found"));
    }

    private GameUnlock requireActiveSession(User user, GameFeatureType feature) {
        evaluateUnlocks(user, getOrCreateProgress(user));
        GameUnlock unlock = getUnlock(user, feature);
        if (!unlock.isUnlocked()) throw new RuntimeException("Locked - Complete more tasks to unlock.");
        if (unlock.getSessionExpiresAt() == null || !unlock.getSessionExpiresAt().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Relax time is over. Return to your tasks.");
        }
        return unlock;
    }

    private boolean alreadyRewardedThisSession(GameUnlock unlock) {
        return unlock.getSessionStartedAt() != null && unlock.getLastRewardAt() != null && !unlock.getLastRewardAt().isBefore(unlock.getSessionStartedAt());
    }

    private void awardGameBonus(User user, GameUnlock unlock, RewardType rewardType, String title, String description, int xpBonus) {
        Progress progress = getOrCreateProgress(user);
        progress.setXpPoints(progress.getXpPoints() + xpBonus);
        progress.setLevel(calculateLevel(progress.getXpPoints()));
        progress.setUpdatedAt(LocalDateTime.now());
        progressRepository.save(progress);

        unlock.setLastRewardAt(LocalDateTime.now());
        gameUnlockRepository.save(unlock);

        rewardRepository.save(Reward.builder()
                .user(user)
                .rewardType(rewardType)
                .code(rewardType.name() + "_" + unlock.getFeature().name() + "_" + unlock.getSessionStartedAt())
                .title(title)
                .description(description)
                .xpAwarded(xpBonus)
                .build());
        createNotification(user, title + ": +" + xpBonus + " XP.");
        evaluateUnlocks(user, progress);
    }

    private void awardBadgeIfMissing(User user, Progress progress, MainTask task, String code, String title, String description, boolean condition, int bonusXp) {
        if (!condition || rewardRepository.existsByUserUserIdAndCode(user.getUserId(), code)) return;
        progress.setXpPoints(progress.getXpPoints() + bonusXp);
        rewardRepository.save(Reward.builder()
                .user(user)
                .task(task)
                .rewardType(RewardType.BADGE)
                .code(code)
                .title(title)
                .description(description)
                .xpAwarded(bonusXp)
                .build());
        createNotification(user, "Badge unlocked: " + title + " (+" + bonusXp + " XP).");
    }

    private int resolveTaskXp(MainTask task) {
        if (task.getXpReward() != null && task.getXpReward() > 0) return task.getXpReward();
        return switch (task.getDifficulty()) {
            case EASY -> 40;
            case MEDIUM -> 75;
            case HARD -> 120;
        };
    }

    private int calculateLevel(int xpPoints) {
        return Math.max(1, (xpPoints / XP_PER_LEVEL) + 1);
    }

    private double calculateLevelProgress(int xpPoints) {
        int currentLevel = calculateLevel(xpPoints);
        int previousLevelXp = (currentLevel - 1) * XP_PER_LEVEL;
        return ((double) (xpPoints - previousLevelXp) / XP_PER_LEVEL) * 100;
    }

    private int calculateQuizBonus(GameFeatureType feature, int score, int totalQuestions) {
        if (totalQuestions == 0 || score == 0) return 0;
        int perQuestionXp = feature == GameFeatureType.ADVANCED_GAME ? 20 : 12;
        return score * perQuestionXp;
    }

    private boolean meetsUnlockRequirements(Progress progress, GameUnlock unlock) {
        return progress.getXpPoints() >= unlock.getRequiredXp();
    }

    private RewardSummaryDto toRewardDto(Reward reward) {
        return RewardSummaryDto.builder()
                .id(reward.getId())
                .rewardType(reward.getRewardType())
                .code(reward.getCode())
                .title(reward.getTitle())
                .description(reward.getDescription())
                .xpAwarded(reward.getXpAwarded())
                .createdAt(reward.getCreatedAt())
                .build();
    }

    private GameUnlockDto toUnlockDto(GameUnlock unlock) {
        return GameUnlockDto.builder()
                .id(unlock.getId())
                .feature(unlock.getFeature())
                .title(unlockTitle(unlock.getFeature()))
                .description(unlockDescription(unlock.getFeature()))
                .unlocked(unlock.isUnlocked())
                .requiredTasks(unlock.getRequiredTasks())
                .requiredXp(unlock.getRequiredXp())
                .unlockedAt(unlock.getUnlockedAt())
                .sessionExpiresAt(unlock.getSessionExpiresAt())
                .activeSession(unlock.getSessionExpiresAt() != null && unlock.getSessionExpiresAt().isAfter(LocalDateTime.now()))
                .build();
    }

    private String unlockTitle(GameFeatureType feature) {
        return UNLOCK_DEFINITIONS.stream().filter(definition -> definition.feature() == feature).map(UnlockDefinition::title).findFirst().orElse(feature.name());
    }

    private String unlockDescription(GameFeatureType feature) {
        return UNLOCK_DEFINITIONS.stream().filter(definition -> definition.feature() == feature).map(UnlockDefinition::description).findFirst().orElse("Complete more tasks to unlock.");
    }

    private BusinessScenarioDto toBusinessScenarioDto(BusinessScenarioSeed scenario) {
        return BusinessScenarioDto.builder()
                .scenarioId(scenario.id())
                .title(scenario.title())
                .prompt(scenario.prompt())
                .options(scenario.outcomes().stream()
                        .map(outcome -> BusinessChoiceDto.builder().optionId(outcome.optionId()).label(outcome.label()).hint(outcome.hint()).build())
                        .toList())
                .build();
    }

    private void createNotification(User user, String message) {
        notificationRepository.save(Notifications.builder().user(user).message(message).build());
    }

    private record UnlockDefinition(GameFeatureType feature, int requiredTasks, int requiredXp, String title, String description) {}
    private record QuestionSeed(Long id, String prompt, List<String> options, int correctOption) {}
    private record BusinessScenarioSeed(Long id, String title, String prompt, List<BusinessOutcome> outcomes) {}
    private record BusinessOutcome(String optionId, String label, String hint, int score, int xpBonus, String result) {}
}
