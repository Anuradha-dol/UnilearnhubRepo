package com.itpm.website.controller.post;

import java.time.ZoneId;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.itpm.website.dtos.post.CommentRequest;
import com.itpm.website.dtos.post.CommentResponse;
import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Comment;
import com.itpm.website.service.post.CommentService;
import com.itpm.website.service.post.CommentServiceImpl;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final CommentServiceImpl commentServices;


    @PostMapping(value = "/{postId}/add", consumes = "multipart/form-data")
    public ResponseEntity<CommentResponse> addComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (content.isBlank() && (attachment == null || attachment.isEmpty())) {
            return ResponseEntity.badRequest().build();
        }

        Comment comment = commentService.addComment(user.getUserId(), postId, content, attachment);

        CommentResponse response = mapToDTO(comment);

        return ResponseEntity.ok(response);
    }


    @PostMapping(value = "/{postId}/add", consumes = "application/json")
    public ResponseEntity<CommentResponse> addCommentJson(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestBody CommentRequest request) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String content = request != null && request.getContent() != null ? request.getContent() : "";
        if (content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Comment comment = commentService.addComment(user.getUserId(), postId, content, null);
        return ResponseEntity.ok(mapToDTO(comment));
    }


    @PostMapping("/{postId}/reply/{parentCommentId}")
    public ResponseEntity<CommentResponse> addReply(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @PathVariable Long parentCommentId,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (content.isBlank() && (attachment == null || attachment.isEmpty())) {
            return ResponseEntity.badRequest().build();
        }

        Comment reply = commentService.addReply(user.getUserId(), postId, parentCommentId, content, attachment);

        CommentResponse response = mapToDTO(reply);

        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{commentId}/delete")
    public ResponseEntity<String> deleteComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long commentId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please login to delete comments");
        }

        Comment comment = commentService.getCommentById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!comment.getUser().getUserId().equals(user.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Cannot delete others' comments");
        }

        commentService.deleteComment(commentId);
        return ResponseEntity.ok("Comment deleted successfully");
    }


    @GetMapping("/{postId}/all")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long postId,
            @RequestParam(value = "limit", required = false) Integer limit) {
        List<Comment> comments = commentService.getCommentsByPost(postId, limit);

        // Convert each Comment entity to DTO recursively
        List<CommentResponse> responses = comments.stream()
                .map(this::mapToDTO)
                .toList();

        return ResponseEntity.ok(responses);
    }


    @GetMapping("/{postId}/count")
    public ResponseEntity<Long> getCommentCount(@PathVariable Long postId) {
        Long count = commentService.countCommentsByPost(postId);
        return ResponseEntity.ok(count);
    }

    private CommentResponse mapToDTO(Comment comment) {
        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .content(comment.getContent())
                .attachmentUrl(comment.getAttachmentUrl())
                .authorName(comment.getUser().getFirstname() + " " + comment.getUser().getLastName())
                // Convert Date -> LocalDateTime
                .createdAt(comment.getCreatedAt().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime())
                .replies(comment.getReplies() != null ?
                        comment.getReplies().stream().map(this::mapToDTO).toList()
                        : List.of())
                .build();
    }

    @PutMapping("/{commentId}/update")
    public ResponseEntity<CommentResponse> updateComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long commentId,
            @RequestBody CommentRequest request) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Comment comment = commentServices.getCommentById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!comment.getUser().getUserId().equals(user.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Comment updated = commentServices.updateComment(commentId, request.getContent());
        return ResponseEntity.ok(mapToDTO(updated));
    }
}
