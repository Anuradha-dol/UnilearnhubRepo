package com.itpm.website.repos.task;

import com.itpm.website.dtos.user.Role;
import com.itpm.website.enities.User;
import com.itpm.website.enities.task.MainTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MainTaskRepository extends JpaRepository<MainTask, Long> {
    List<MainTask> findByUserUserId(Long userId);
    List<MainTask> findByUser(User user);
    List<MainTask> findAllByOrderByCreatedAtDesc();

    @Query("""
            select task
            from MainTask task
            where task.assignedBy is not null
            and task.assignedBy.role = :adminRole
            and task.user.userId <> task.assignedBy.userId
            order by task.createdAt desc
            """)
    List<MainTask> findAdminAssignedTasks(@Param("adminRole") Role adminRole);
}
