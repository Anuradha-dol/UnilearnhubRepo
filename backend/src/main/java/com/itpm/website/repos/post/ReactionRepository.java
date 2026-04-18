package com.itpm.website.repos.post;

import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import com.itpm.website.enities.post.Reaction;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    Optional<Reaction> findByUserAndPost(User user, Post post);

    List<Reaction> findByPost(Post post);

    Long countByPostAndType(Post post, String type);

    boolean existsByUserAndPostAndType(User user, Post post, String type);

    List<Reaction> findByUser(User user);


    @Modifying
    @Transactional
    @Query("DELETE FROM Reaction r WHERE r.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}

