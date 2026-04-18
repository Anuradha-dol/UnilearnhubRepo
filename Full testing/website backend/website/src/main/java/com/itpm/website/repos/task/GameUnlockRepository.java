package com.itpm.website.repos.task;

import com.itpm.website.dtos.task.GameFeatureType;
import com.itpm.website.enities.task.GameUnlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GameUnlockRepository extends JpaRepository<GameUnlock, Long> {
    Optional<GameUnlock> findByUserUserIdAndFeature(Long userId, GameFeatureType feature);

    List<GameUnlock> findByUserUserIdOrderByRequiredTasksAsc(Long userId);
}
