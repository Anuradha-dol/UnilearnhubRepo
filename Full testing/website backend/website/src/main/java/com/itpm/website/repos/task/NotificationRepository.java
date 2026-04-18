package com.itpm.website.repos.task;

import com.itpm.website.enities.task.Notifications;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;

public interface NotificationRepository extends JpaRepository<Notifications, Long> {
    List<Notifications> findByUserUserIdAndReadFalse(Long userId);
}
