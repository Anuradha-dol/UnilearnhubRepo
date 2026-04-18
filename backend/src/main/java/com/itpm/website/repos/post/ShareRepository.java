package com.itpm.website.repos.post;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import com.itpm.website.enities.post.Share;

import jakarta.transaction.Transactional;

@Repository
public interface ShareRepository extends JpaRepository<Share, Long> {

    boolean existsByUserAndPost(User user, Post post);

    Long countByPost(Post post);

    @Query("SELECT s.post.postId, COUNT(s.shareId) FROM Share s WHERE s.post.postId IN :postIds GROUP BY s.post.postId")
    List<Object[]> countSharesByPostIds(@Param("postIds") List<Long> postIds);

    @EntityGraph(attributePaths = {"post", "post.user", "user"})
    List<Share> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"post", "post.user", "user"})
    List<Share> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"post", "post.user", "user"})
    @Query("select s from Share s join PostHashtag h on h.post = s.post where h.tag = :tag order by s.createdAt desc")
    List<Share> findByHashtag(@Param("tag") String tag, Pageable pageable);

    void deleteByShareIdAndUser(Long shareId, User user);

    @EntityGraph(attributePaths = {"post", "post.user", "user"})
    List<Share> findByUserOrderByCreatedAtDesc(User user);

<<<<<<< HEAD
    @Query("""
            SELECT s.post.postId, COUNT(s)
            FROM Share s
            WHERE s.post.postId IN :postIds
            GROUP BY s.post.postId
            """)
    List<Object[]> countSharesByPostIds(@Param("postIds") List<Long> postIds);
=======
    @EntityGraph(attributePaths = {"post", "post.user", "user"})
    List<Share> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
>>>>>>> 0f8eea20b4e90e0cc15af04d4a054f0067a282f2

    @Transactional
    @Modifying
    @Query("DELETE FROM Share s WHERE s.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
