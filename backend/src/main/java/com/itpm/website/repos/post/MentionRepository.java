package com.itpm.website.repos.post;

import org.springframework.data.jpa.repository.JpaRepository;

import com.itpm.website.enities.post.Mention;

public interface MentionRepository extends JpaRepository<Mention, Long> {
    boolean existsByPost_PostIdAndMentionedUser_UserId(Long postId, Long userId);
}
