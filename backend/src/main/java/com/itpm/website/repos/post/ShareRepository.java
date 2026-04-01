package com.itpm.website.repos.post;

import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import com.itpm.website.enities.post.Share;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShareRepository extends JpaRepository<Share, Long> {

    boolean existsByUserAndPost(User user, Post post);

    Long countByPost(Post post);

    List<Share> findAllByOrderByCreatedAtDesc();

    void deleteByShareIdAndUser(Long shareId, User user);

    List<Share> findByUserOrderByCreatedAtDesc(User user);

    @Transactional
    @Modifying
    @Query("DELETE FROM Share s WHERE s.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
