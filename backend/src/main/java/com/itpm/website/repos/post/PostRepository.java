package com.itpm.website.repos.post;

import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import com.itpm.website.dtos.user.Interest;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Pageable;
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

<<<<<<< HEAD
    List<Post> findTop25ByLearningPreferenceAndUser_UserIdNotOrderByCreatedAtDesc(Interest learningPreference, Long excludedUserId);
=======
    List<Post> findByUserOrderByCreatedAtDesc(User user);

    List<Post> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Post> findTop25ByLearningPreferenceAndUser_UserIdNotOrderByCreatedAtDesc(Interest learningPreference, Long userId);
>>>>>>> 0f8eea20b4e90e0cc15af04d4a054f0067a282f2

    @Transactional
    @Modifying
    @Query("DELETE FROM Post p WHERE p.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
