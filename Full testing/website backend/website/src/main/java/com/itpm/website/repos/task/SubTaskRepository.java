package com.itpm.website.repos.task;

import com.itpm.website.enities.task.SubTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubTaskRepository extends JpaRepository<SubTask, Long> {
    List<SubTask> findByMainTaskId(Long mainTaskId);
}
