package com.itpm.website.service.post;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.itpm.website.dtos.user.Interest;
import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Mention;
import com.itpm.website.enities.post.Post;
import com.itpm.website.enities.post.PostHashtag;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.post.MentionRepository;
import com.itpm.website.repos.post.PostHashtagRepository;
import com.itpm.website.repos.post.PostRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private static final Pattern HASHTAG_PATTERN = Pattern.compile("(?<!\\w)#([A-Za-z][A-Za-z0-9_-]{0,49})");
    private static final Pattern MENTION_PATTERN = Pattern.compile("(?<!\\w)@([A-Za-z][A-Za-z0-9._-]*(?:\\s+[A-Za-z][A-Za-z0-9._-]*)?)");

    private final PostRepository postRepository;
    private final UserRepo userRepository;
    private final MentionRepository mentionRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final NotificationService notificationService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public Post createPost(Long userId, String content, MultipartFile imageFile, Interest learningPreference) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = null;

        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                File folder = new File(uploadDir).getAbsoluteFile();
                if (!folder.exists()) folder.mkdirs();

                String originalFilename = imageFile.getOriginalFilename();
                String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                String filename = UUID.randomUUID() + extension;

                File dest = new File(folder, filename);
                imageFile.transferTo(dest);

                imageUrl = "/uploads/" + filename;
            } catch (IOException e) {
                throw new RuntimeException("Failed to save image", e);
            }
        }

        Post post = Post.builder()
                .user(user)
                .content(content)
                .learningPreference(user.getInterest())
                .imageUrl(imageUrl)
                .learningPreference(learningPreference)
                .createdAt(LocalDateTime.now())
                .build();

        Post savedPost = postRepository.save(post);

        Set<String> hashtags = extractHashtags(content);
        if (!hashtags.isEmpty()) {
            persistHashtags(savedPost, hashtags);
        }

        List<User> mentionedUsers = resolveMentionedUsers(content, userId);
        if (!mentionedUsers.isEmpty()) {
            persistMentions(savedPost, mentionedUsers);
            notificationService.notifyUsersMentionedInPost(savedPost, mentionedUsers);
        }

        notificationService.notifyUsersForNewPost(savedPost);
        return savedPost;
    }

    @Override
    public void deletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        postRepository.delete(post);
    }

    @Override
    public List<Post> getPostsByUser(Long userId) {
        return getPostsByUser(userId, 30);
    }

    @Override
    public List<Post> getPostsByUser(Long userId, int limit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int safeLimit = Math.max(1, Math.min(limit, 100));
        return postRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, safeLimit));
    }

    @Override
    public Post getPostById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    @Override
    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

<<<<<<< HEAD
=======
    private Set<String> extractHashtags(String content) {
        if (content == null || content.isBlank()) {
            return Set.of();
        }

        Set<String> hashtags = new LinkedHashSet<>();
        Matcher matcher = HASHTAG_PATTERN.matcher(content);
        while (matcher.find()) {
            String tag = matcher.group(1);
            if (tag != null && !tag.isBlank()) {
                hashtags.add(tag.toLowerCase(Locale.ROOT));
            }
        }
        return hashtags;
    }

    private void persistHashtags(Post post, Set<String> hashtags) {
        for (String tag : hashtags) {
            postHashtagRepository.save(
                    PostHashtag.builder()
                            .post(post)
                            .tag(tag)
                            .build()
            );
        }
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

    private void persistMentions(Post post, List<User> mentionedUsers) {
        for (User mentionedUser : mentionedUsers) {
            if (mentionRepository.existsByPost_PostIdAndMentionedUser_UserId(post.getPostId(), mentionedUser.getUserId())) {
                continue;
            }

            mentionRepository.save(
                    Mention.builder()
                            .post(post)
                            .mentionedUser(mentionedUser)
                            .build()
            );
        }
    }

>>>>>>> 0f8eea20b4e90e0cc15af04d4a054f0067a282f2
}
