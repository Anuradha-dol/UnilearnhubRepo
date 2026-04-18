package com.itpm.website.service.post;

import java.util.List;
import java.util.Optional;

import org.springframework.web.multipart.MultipartFile;

import com.itpm.website.enities.post.Comment;

public interface CommentService {
    Comment addComment(Long userId, Long postId, String content, MultipartFile attachment);
    Comment addReply(Long userId, Long postId, Long parentCommentId, String content, MultipartFile attachment);
    void deleteComment(Long commentId);
    List<Comment> getCommentsByPost(Long postId);
    List<Comment> getCommentsByPost(Long postId, Integer limit);
    Long countCommentsByPost(Long postId);
    Optional<Comment> getCommentById(Long commentId);




}
