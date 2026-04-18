package com.itpm.website.repos.task;

import com.itpm.website.dtos.task.RewardType;
import com.itpm.website.enities.task.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RewardRepository extends JpaRepository<Reward, Long> {
    List<Reward> findTop5ByUserUserIdOrderByCreatedAtDesc(Long userId);

    List<Reward> findByUserUserIdAndRewardTypeOrderByCreatedAtDesc(Long userId, RewardType rewardType);

    boolean existsByUserUserIdAndCode(Long userId, String code);

    long deleteByTask_IdAndRewardType(Long taskId, RewardType rewardType);

    @Modifying
    @Query("update Reward r set r.task = null where r.task.id = :taskId")
    void clearTaskReferences(@Param("taskId") Long taskId);
}
