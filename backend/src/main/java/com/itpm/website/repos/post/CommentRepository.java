package com.itpm.website.repos.post;

import com.itpm.website.enities.post.Comment;
import com.itpm.website.enities.post.Post;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {


    List<Comment> findByPostAndParentCommentIsNull(Post post);


    Long countByPost(Post post);

    @Query("SELECT c FROM Comment c " +
            "LEFT JOIN FETCH c.replies r " +
            "WHERE c.post.postId = :postId AND c.parentComment IS NULL")
    List<Comment> findTopLevelCommentsWithReplies(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Comment c WHERE c.user.userId = :userId OR c.parentComment.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
