package com.itpm.website.repos.learning;

import com.itpm.website.enities.learning.UserVideoQuizAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserVideoQuizAssignmentRepository extends JpaRepository<UserVideoQuizAssignment, Long> {
    Optional<UserVideoQuizAssignment> findByUserIdAndVideoId(Long userId, Long videoId);
    List<UserVideoQuizAssignment> findByVideoId(Long videoId);
}
