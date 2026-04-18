package com.itpm.website.service.task;

import com.itpm.website.dtos.task.*;
import com.itpm.website.dtos.user.Role;
import com.itpm.website.enities.User;
import com.itpm.website.enities.task.MainTask;
import com.itpm.website.enities.task.Notifications;
import com.itpm.website.enities.task.SubTask;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.task.MainTaskRepository;
import com.itpm.website.repos.task.NotificationRepository;
import com.itpm.website.repos.task.RewardRepository;
import com.itpm.website.repos.task.SubTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final MainTaskRepository mainTaskRepo;
    private final SubTaskRepository subTaskRepo;
    private final NotificationRepository notificationRepo;
    private final RewardRepository rewardRepo;
    private final UserRepo userRepo;
    private final TaskGamificationService taskGamificationService;

    @Transactional
    public MainTaskResponseDTO createSelfTask(MainTaskRequest request, User currentUser) {
        MainTaskRequest.MainTaskDetails taskDetails = request.getMainTask();
        if (taskDetails == null) throw new RuntimeException("Task details are required");

        MainTask task = MainTask.builder()
                .title(taskDetails.getTitle())
                .description(taskDetails.getDescription())
                .difficulty(taskDetails.getDifficulty())
                .startDate(taskDetails.getStartDate())
                .endDate(taskDetails.getEndDate())
                .user(currentUser)
                .assignedBy(currentUser)
                .build();

        List<SubTask> subTasks = request.getSubTasks() == null ? List.of() : request.getSubTasks().stream()
                .filter(subTask -> subTask.getTitle() != null && !subTask.getTitle().isBlank())
                .map(subTask -> SubTask.builder().title(subTask.getTitle().trim()).build())
                .toList();

        MainTask savedTask = createMainTask(task, subTasks);
        scheduleReminders(savedTask);
        return toResponse(savedTask);
    }

    @Transactional
    public MainTaskResponseDTO assignTask(AdminTaskCreateRequest request, User adminUser) {
        User assignee = userRepo.findById(request.getAssignedUserId())
                .orElseThrow(() -> new RuntimeException("Assigned user not found"));

        MainTask task = MainTask.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .endDate(request.getDeadline())
                .xpReward(request.getXpReward())
                .user(assignee)
                .assignedBy(adminUser)
                .build();

        List<SubTask> subTasks = request.getSubTaskTitles() == null ? List.of() : request.getSubTaskTitles().stream()
                .filter(title -> title != null && !title.isBlank())
                .map(title -> SubTask.builder().title(title.trim()).build())
                .toList();

        MainTask savedTask = createMainTask(task, subTasks);
        scheduleReminders(savedTask);
        createNotification(assignee, "Admin " + fullName(adminUser) + " assigned '" + savedTask.getTitle() + "' to you.");
        return toResponse(savedTask);
    }

    @Transactional
    public MainTask createMainTask(MainTask task, List<SubTask> subTasks) {
        applyDefaults(task);
        List<SubTask> safeSubTasks = subTasks == null ? new ArrayList<>() : new ArrayList<>(subTasks);
        task.setSubTasks(new ArrayList<>());
        for (SubTask sub : safeSubTasks) task.addSubTask(sub);

        MainTask savedTask = mainTaskRepo.save(task);
        taskGamificationService.ensurePlayerProfile(savedTask.getUser());
        createNotification(savedTask.getUser(), "New task '" + savedTask.getTitle() + "' is ready. Complete it to earn " + savedTask.getXpReward() + " XP.");
        return savedTask;
    }

    @Transactional
    public List<MainTaskResponseDTO> getTaskResponsesByUser(User user) {
        taskGamificationService.ensurePlayerProfile(user);
        return mainTaskRepo.findByUser(user).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<MainTaskResponseDTO> getAllTaskResponses() {
        return mainTaskRepo.findAdminAssignedTasks(Role.ROLE_ADMIN).stream().map(this::toResponse).toList();
    }

    @Transactional
    public TaskDashboardResponse getDashboard(User user) {
        return taskGamificationService.buildDashboard(user);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard() {
        return taskGamificationService.getLeaderboard();
    }

    @Transactional(readOnly = true)
    public List<UserResponseDto> getAssignableUsers() {
        return userRepo.findByRoleOrderByFirstnameAscLastNameAsc(Role.ROLE_USER).stream().map(this::toUserDto).toList();
    }

    @Transactional
    public SubTask updateSubTaskStatus(Long id, SubTaskStatus status, User currentUser) {
        SubTask subTask = getSubTaskById(id);
        MainTask task = subTask.getMainTask();
        ensureTaskAccess(task, currentUser);
        boolean wasComplete = task.isComplete();
        boolean alreadyRewarded = task.isRewardGranted();
        subTask.setStatus(status);
        subTaskRepo.save(subTask);
        boolean isCompleteNow = task.isComplete();
        if (!wasComplete && isCompleteNow && !alreadyRewarded) {
            taskGamificationService.handleTaskCompletion(task.getUser(), task);
        } else if (wasComplete && !isCompleteNow) {
            taskGamificationService.handleTaskReopened(task.getUser(), task);
        }
        createNotification(task.getUser(), "Subtask '" + subTask.getTitle() + "' is now " + status + ".");
        return subTask;
    }

    @Transactional
    public MainTaskResponseDTO completeTask(Long id, User currentUser) {
        MainTask task = getMainTaskById(id);
        ensureTaskAccess(task, currentUser);
        if (task.getSubTasks() == null || task.getSubTasks().isEmpty()) task.setCompletedAt(LocalDateTime.now());
        else task.getSubTasks().forEach(subTask -> subTask.setStatus(SubTaskStatus.COMPLETE));
        if (!task.isRewardGranted()) taskGamificationService.handleTaskCompletion(task.getUser(), task);
        mainTaskRepo.save(task);
        createNotification(task.getUser(), "Task '" + task.getTitle() + "' is complete. Enjoy your unlocked rewards.");
        return toResponse(task);
    }

    @Transactional
    public void deleteMainTask(Long id, User currentUser) {
        MainTask task = getMainTaskById(id);
        ensureTaskAccess(task, currentUser);
        detachTaskRewards(task);
        mainTaskRepo.delete(task);
    }

    @Transactional
    public void deleteMainTaskAsAdmin(Long id) {
        MainTask task = getMainTaskById(id);
        if (!isAdminAssignedTask(task)) {
            throw new AccessDeniedException("Only admin-assigned tasks can be deleted here");
        }
        detachTaskRewards(task);
        mainTaskRepo.delete(task);
    }

    @Transactional
    public void deleteSubTask(Long id, User currentUser) {
        SubTask subTask = getSubTaskById(id);
        ensureTaskAccess(subTask.getMainTask(), currentUser);
        subTaskRepo.delete(subTask);
    }

    @Transactional(readOnly = true)
    public MainTask getMainTaskById(Long id) {
        return mainTaskRepo.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
    }

    @Transactional(readOnly = true)
    public SubTask getSubTaskById(Long id) {
        return subTaskRepo.findById(id).orElseThrow(() -> new RuntimeException("SubTask not found"));
    }

    @Transactional(readOnly = true)
    public Notifications getNotificationById(Long id) {
        return notificationRepo.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    @Transactional(readOnly = true)
    public List<Notifications> getUnreadNotifications(Long userId) {
        return notificationRepo.findByUserUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markNotificationRead(Long id, User currentUser) {
        Notifications notification = getNotificationById(id);
        if (!notification.getUser().getUserId().equals(currentUser.getUserId())) throw new AccessDeniedException("Not your notification");
        notification.setRead(true);
        notificationRepo.save(notification);
    }

    @Transactional
    public void deleteNotification(Long id, User currentUser) {
        Notifications notification = getNotificationById(id);
        if (!notification.getUser().getUserId().equals(currentUser.getUserId())) throw new AccessDeniedException("Not your notification");
        notificationRepo.delete(notification);
    }

    public void scheduleReminders(MainTask task) {
        if (task.getEndDate() == null) return;
        LocalDate today = LocalDate.now();
        for (Long daysBefore : List.of(3L, 1L)) {
            LocalDate reminderDate = task.getEndDate().minusDays(daysBefore);
            if (!reminderDate.isBefore(today)) {
                createNotification(task.getUser(), "Reminder: Task '" + task.getTitle() + "' is due in " + daysBefore + " day(s).");
            }
        }
    }

    public MainTaskResponseDTO toResponse(MainTask task) {
        return MainTaskResponseDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .difficulty(task.getDifficulty())
                .startDate(task.getStartDate())
                .endDate(task.getEndDate())
                .xpReward(task.getXpReward())
                .progress(task.getProgress())
                .complete(task.isComplete())
                .rewardGranted(task.isRewardGranted())
                .user(toUserDto(task.getUser()))
                .assignedBy(task.getAssignedBy() == null ? null : fullName(task.getAssignedBy()))
                .createdAt(task.getCreatedAt())
                .completedAt(task.getCompletedAt())
                .subTasks(task.getSubTasks())
                .build();
    }

    private void applyDefaults(MainTask task) {
        if (task.getStartDate() == null) task.setStartDate(LocalDate.now());
        if (task.getEndDate() == null) task.setEndDate(task.getStartDate().plusDays(7));
        if (task.getDifficulty() == null) task.setDifficulty(TaskDifficulty.MEDIUM);
        if (task.getXpReward() == null || task.getXpReward() <= 0) task.setXpReward(resolveDefaultXp(task.getDifficulty()));
    }

    private int resolveDefaultXp(TaskDifficulty difficulty) {
        return switch (difficulty) {
            case EASY -> 40;
            case MEDIUM -> 75;
            case HARD -> 120;
        };
    }

    private void ensureTaskAccess(MainTask task, User currentUser) {
        boolean isOwner = task.getUser().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;
        if (!isOwner && !isAdmin) throw new AccessDeniedException("Not your task");
    }

    private void createNotification(User user, String message) {
        notificationRepo.save(Notifications.builder().user(user).message(message).build());
    }

    private void detachTaskRewards(MainTask task) {
        if (task.getId() != null) {
            rewardRepo.clearTaskReferences(task.getId());
        }
    }

    private boolean isAdminAssignedTask(MainTask task) {
        return task.getAssignedBy() != null
                && task.getAssignedBy().getRole() == Role.ROLE_ADMIN
                && !task.getAssignedBy().getUserId().equals(task.getUser().getUserId());
    }

    private UserResponseDto toUserDto(User user) {
        return new UserResponseDto(user.getUserId(), user.getFirstname(), user.getLastName(), user.getEmail());
    }

    private String fullName(User user) {
        return (user.getFirstname() + " " + user.getLastName()).trim();
    }
}
