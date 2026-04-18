package com.itpm.website.repos.post;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.itpm.website.enities.post.SavedPost;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {

    @EntityGraph(attributePaths = {"post", "post.user", "collection"})
    List<SavedPost> findByUser_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"post", "post.user", "collection"})
    List<SavedPost> findByUser_UserIdAndCollection_CollectionIdOrderByCreatedAtDesc(Long userId, Long collectionId, Pageable pageable);

    Optional<SavedPost> findByUser_UserIdAndPost_PostId(Long userId, Long postId);

    boolean existsByUser_UserIdAndPost_PostId(Long userId, Long postId);

    void deleteByUser_UserIdAndPost_PostId(Long userId, Long postId);

    long countByCollection_CollectionId(Long collectionId);

    @Query("select sp.post.postId from SavedPost sp where sp.user.userId = :userId")
    List<Long> findSavedPostIdsByUserId(@Param("userId") Long userId);
}
