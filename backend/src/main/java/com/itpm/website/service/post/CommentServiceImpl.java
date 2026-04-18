package com.itpm.website.service.post;

import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Comment;
import com.itpm.website.enities.post.Post;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.post.CommentRepository;
import com.itpm.website.repos.post.PostRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepo userRepository;

        @Value("${file.upload-dir:uploads}")
        private String uploadDir;

    @Override
    public Comment addComment(Long userId, Long postId, String content, MultipartFile attachment) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        String attachmentUrl = saveAttachment(attachment);

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .content(content)
                .attachmentUrl(attachmentUrl)
                .createdAt(new Date())
                .parentComment(null)
                .build();

        return commentRepository.save(comment);
    }

    @Override
    public Comment addReply(Long userId, Long postId, Long parentCommentId, String content, MultipartFile attachment) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new RuntimeException("Parent comment not found"));

        String attachmentUrl = saveAttachment(attachment);

        Comment reply = Comment.builder()
                .user(user)
                .post(post)
                .content(content)
                .attachmentUrl(attachmentUrl)
                .parentComment(parent)
                .createdAt(new Date())
                .build();

        return commentRepository.save(reply);
    }

    @Override
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        commentRepository.delete(comment);
    }

    @Override
    public List<Comment> getCommentsByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return commentRepository.findByPostAndParentCommentIsNull(post);
    }

    @Override
    public Optional<Comment> getCommentById(Long commentId) {
        return commentRepository.findById(commentId);
    }

    @Override
    public Long countCommentsByPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return commentRepository.countByPost(post);
    }

    public Comment updateComment(Long commentId, String newContent) {
        Optional<Comment> optionalComment = commentRepository.findById(commentId);
        if (optionalComment.isEmpty()) {
            throw new RuntimeException("Comment not found");
        }

        Comment comment = optionalComment.get();
        comment.setContent(newContent);
        return commentRepository.save(comment);
    }

        private String saveAttachment(MultipartFile attachment) {
                if (attachment == null || attachment.isEmpty()) {
                        return null;
                }

                try {
                        File folder = new File(uploadDir, "reply-attachments").getAbsoluteFile();
                        if (!folder.exists()) {
                                folder.mkdirs();
                        }

                        String originalName = attachment.getOriginalFilename();
                        String extension = "";
                        if (originalName != null) {
                                int dotIndex = originalName.lastIndexOf('.');
                                if (dotIndex >= 0) {
                                        extension = originalName.substring(dotIndex);
                                }
                        }

                        String filename = UUID.randomUUID() + extension;
                        File destination = new File(folder, filename);
                        attachment.transferTo(destination);

                        return "/uploads/reply-attachments/" + filename;
                } catch (IOException ex) {
                        throw new RuntimeException("Failed to save reply attachment", ex);
                }
        }

}
