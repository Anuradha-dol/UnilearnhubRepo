package com.itpm.website.repos.task;

import com.itpm.website.enities.task.Progress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProgressRepository extends JpaRepository<Progress, Long> {
    Optional<Progress> findByUserUserId(Long userId);

    List<Progress> findTop10ByOrderByXpPointsDescCompletedTasksDesc();
}
