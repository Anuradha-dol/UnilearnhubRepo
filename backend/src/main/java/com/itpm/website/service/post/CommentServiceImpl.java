package com.itpm.website.service.post;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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

    private static final Pattern MENTION_PATTERN = Pattern.compile("(?<!\\w)@([A-Za-z][A-Za-z0-9._-]*(?:\\s+[A-Za-z][A-Za-z0-9._-]*)?)");

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepo userRepository;
    private final NotificationService notificationService;

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

        Comment savedComment = commentRepository.save(comment);
        notifyUsersMentionedInComment(savedComment, userId);
        return savedComment;
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

        Comment savedReply = commentRepository.save(reply);
        notifyUsersMentionedInComment(savedReply, userId);
        return savedReply;
    }

    @Override
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        commentRepository.delete(comment);
    }

    @Override
    public List<Comment> getCommentsByPost(Long postId) {
        return getCommentsByPost(postId, null);
    }

    @Override
    public List<Comment> getCommentsByPost(Long postId, Integer limit) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        List<Comment> comments = commentRepository.findByPostAndParentCommentIsNullOrderByCreatedAtDesc(post);
        if (limit == null || limit <= 0) {
            return comments;
        }

        return comments.stream()
                .limit(limit)
                .collect(Collectors.toList());
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

    private void notifyUsersMentionedInComment(Comment comment, Long authorUserId) {
        if (comment == null || comment.getPost() == null) {
            return;
        }

        List<User> mentionedUsers = resolveMentionedUsers(comment.getContent(), authorUserId);
        if (mentionedUsers.isEmpty()) {
            return;
        }

        notificationService.notifyUsersMentionedInComment(comment.getPost(), comment, mentionedUsers);
    }

    private List<User> resolveMentionedUsers(String content, Long authorUserId) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        Map<Long, User> uniqueUsers = new LinkedHashMap<>();
        Matcher matcher = MENTION_PATTERN.matcher(content);

        while (matcher.find()) {
            String rawMention = matcher.group(1);
            if (rawMention == null || rawMention.isBlank()) {
                continue;
            }

            User resolved = resolveMentionCandidate(rawMention.trim());
            if (resolved == null || resolved.getUserId() == null) {
                continue;
            }
            if (resolved.getUserId().equals(authorUserId)) {
                continue;
            }

            uniqueUsers.putIfAbsent(resolved.getUserId(), resolved);
        }

        return new ArrayList<>(uniqueUsers.values());
    }

    private User resolveMentionCandidate(String mentionText) {
        if (mentionText == null || mentionText.isBlank()) {
            return null;
        }

        String[] parts = mentionText.split("\\s+", 2);
        if (parts.length >= 2) {
            return userRepository
                    .findFirstByFirstnameIgnoreCaseAndLastNameIgnoreCase(parts[0], parts[1])
                    .orElse(null);
        }

        List<User> firstNameMatches = userRepository.findByFirstnameIgnoreCase(parts[0]);
        if (firstNameMatches.size() == 1) {
            return firstNameMatches.get(0);
        }

        List<User> lastNameMatches = userRepository.findByLastNameIgnoreCase(parts[0]);
        if (lastNameMatches.size() == 1) {
            return lastNameMatches.get(0);
        }

        return null;
    }

}
