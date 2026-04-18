package com.itpm.website.service.task;

import com.itpm.website.enities.task.MainTask;
import com.itpm.website.enities.task.Notifications;
import com.itpm.website.repos.task.MainTaskRepository;
import com.itpm.website.repos.task.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TaskReminderScheduler {
    private final MainTaskRepository mainTaskRepo;
    private final NotificationRepository notificationRepo;

    @Scheduled(cron = "0 45 18 * * ?") // every day 6:45 PM
    public void sendReminders(){
        LocalDate today = LocalDate.now();
        List<MainTask> tasks = mainTaskRepo.findAll();

        for(MainTask task : tasks){
            long daysLeft = ChronoUnit.DAYS.between(today, task.getEndDate());
            double progress = task.getProgress();
            if(daysLeft <= 0 || progress>=100) continue;

            Notifications n = Notifications.builder()
                    .user(task.getUser())
                    .message("Task '"+task.getTitle()+"' progress: "+(int)progress+"%, Days remaining: "+daysLeft)
                    .build();
            notificationRepo.save(n);
        }
    }
}
