package com.itpm.website.repos.post;

import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByUser_UserIdInOrderByCreatedAtDesc(Set<Long> userIds);

    List<Post> findByUser(User user);

    @Transactional
    @Modifying
    @Query("DELETE FROM Post p WHERE p.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
