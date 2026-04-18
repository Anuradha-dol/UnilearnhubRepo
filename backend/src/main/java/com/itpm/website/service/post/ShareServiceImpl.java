package com.itpm.website.service.post;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

import com.itpm.website.utils.UploadMediaResolver;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.itpm.website.dtos.post.FeedResponse;
import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import com.itpm.website.enities.post.PostHashtag;
import com.itpm.website.enities.post.Share;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.post.PostHashtagRepository;
import com.itpm.website.repos.post.PostRepository;
import com.itpm.website.repos.post.ShareRepository;


import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ShareServiceImpl implements ShareService {

    private final ShareRepository shareRepository;
    private final UserRepo userRepository;
    private final PostRepository postRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final UploadMediaResolver uploadMediaResolver;

    private Map<Long, Long> buildShareCountByPostId(List<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Map.of();
        }

        List<Long> distinctPostIds = postIds.stream().distinct().toList();
        Map<Long, Long> counts = new HashMap<>();

        for (Object[] row : shareRepository.countSharesByPostIds(distinctPostIds)) {
            if (row == null || row.length < 2) {
                continue;
            }

            Long postId = ((Number) row[0]).longValue();
            Long count = ((Number) row[1]).longValue();
            counts.put(postId, count);
        }

        return counts;
    }

    private Map<Long, List<String>> loadHashtagsByPostIds(List<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<String>> result = new LinkedHashMap<>();
        for (Long postId : postIds) {
            result.put(postId, new ArrayList<>());
        }

        for (PostHashtag hashtag : postHashtagRepository.findByPost_PostIdIn(postIds)) {
            Long postId = hashtag.getPost().getPostId();
            result.computeIfAbsent(postId, key -> new ArrayList<>())
                    .add("#" + hashtag.getTag().toLowerCase(Locale.ROOT));
        }

        return result;
    }

    private String normalizeHashtag(String rawTag) {
        if (rawTag == null) {
            return "";
        }

        String cleaned = rawTag.trim();
        if (cleaned.startsWith("#")) {
            cleaned = cleaned.substring(1);
        }

        return cleaned.toLowerCase(Locale.ROOT);
    }

    private List<FeedResponse> buildFeed(List<Post> posts, List<Share> shares, int limit) {
        List<Long> postIds = Stream.concat(
                        posts.stream().map(Post::getPostId),
                        shares.stream().map(share -> share.getPost().getPostId())
                )
                .distinct()
                .toList();

        Map<Long, Long> shareCountsByPostId = buildShareCountByPostId(postIds);
        Map<Long, List<String>> hashtagsByPostId = loadHashtagsByPostIds(postIds);

        List<FeedResponse> postFeed = posts.stream()
                .map(post -> FeedResponse.builder()
                        .type("POST")
                        .postId(post.getPostId())
                        .authorName(post.getAuthorName())
                        .content(post.getContent())
                        .imageUrl(uploadMediaResolver.safeUploadUrl(post.getImageUrl()))
                        .learningPreference(post.getLearningPreference())
                        .createdAt(post.getCreatedAt())
                        .shareCount(shareCountsByPostId.getOrDefault(post.getPostId(), 0L))
                        .hashtags(hashtagsByPostId.getOrDefault(post.getPostId(), List.of()))
                        .build())
                .toList();

        List<FeedResponse> shareFeed = shares.stream()
                .map(share -> FeedResponse.builder()
                        .type("SHARE")
                        .postId(share.getShareId())
                        .originalPostId(share.getPost().getPostId())
                        .authorName(share.getPost().getAuthorName())
                        .content(share.getPost().getContent())
                        .imageUrl(uploadMediaResolver.safeUploadUrl(share.getPost().getImageUrl()))
                        .learningPreference(share.getPost().getLearningPreference())
                        .shareCount(shareCountsByPostId.getOrDefault(share.getPost().getPostId(), 0L))
                        .sharedByName(share.getUser().getFirstname() + " " + share.getUser().getLastName())
                        .shareCaption(share.getCaption())
                        .sharedAt(share.getCreatedAt())
                        .hashtags(hashtagsByPostId.getOrDefault(share.getPost().getPostId(), List.of()))
                        .build())
                .toList();

        return Stream.concat(postFeed.stream(), shareFeed.stream())
                .sorted((a, b) -> {
                    LocalDateTime timeA = a.getType().equals("SHARE")
                            ? a.getSharedAt()
                            : a.getCreatedAt();

                    LocalDateTime timeB = b.getType().equals("SHARE")
                            ? b.getSharedAt()
                            : b.getCreatedAt();

                    return timeB.compareTo(timeA);
                })
                .limit(limit)
                .toList();
    }

    @Override
    public Share sharePost(Long userId, Long postId, String caption) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Share share = Share.builder()
                .user(user)
                .post(post)
                .caption(caption)
                .build();

        return shareRepository.save(share);
    }

    @Override
    public List<FeedResponse> getFullFeed() {
        return getFullFeed(50);
    }

    @Override
    public List<FeedResponse> getFullFeed(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));

        List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, safeLimit));
        List<Share> shares = shareRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, safeLimit));

        return buildFeed(posts, shares, safeLimit);
    }

    @Override
    public List<FeedResponse> getFullFeedByHashtag(String rawTag, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        String normalizedTag = normalizeHashtag(rawTag);
        if (normalizedTag.isBlank()) {
            return getFullFeed(safeLimit);
        }

        List<Post> posts = postHashtagRepository.findPostsByTag(normalizedTag, PageRequest.of(0, safeLimit));
        List<Share> shares = shareRepository.findByHashtag(normalizedTag, PageRequest.of(0, safeLimit));
        return buildFeed(posts, shares, safeLimit);
    }

    @Override
    public List<FeedResponse> getMyShares(Long userId) {
        return getMyShares(userId, 30);
    }

    @Override
    public List<FeedResponse> getMyShares(Long userId, int limit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<Share> shares = shareRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, safeLimit));
        Map<Long, Long> shareCountsByPostId = buildShareCountByPostId(
                shares.stream().map(share -> share.getPost().getPostId()).toList()
        );
        Map<Long, List<String>> hashtagsByPostId = loadHashtagsByPostIds(
                shares.stream().map(share -> share.getPost().getPostId()).toList()
        );

        return shares.stream()
                .map(share -> FeedResponse.builder()
                        .type("SHARE")
                        .postId(share.getShareId())
                        .originalPostId(share.getPost().getPostId())
                        .authorName(share.getPost().getAuthorName())
                        .content(share.getPost().getContent())
                        .imageUrl(uploadMediaResolver.safeUploadUrl(share.getPost().getImageUrl()))
                        .learningPreference(share.getPost().getLearningPreference())
                        .shareCount(shareCountsByPostId.getOrDefault(share.getPost().getPostId(), 0L))
                        .sharedByName(share.getUser().getFirstname() + " " + share.getUser().getLastName())
                        .shareCaption(share.getCaption())
                        .sharedAt(share.getCreatedAt())
                        .hashtags(hashtagsByPostId.getOrDefault(share.getPost().getPostId(), List.of()))
                        .build())
                .toList();
    }

    @Override
    public void deleteShare(Long userId, Long shareId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Share share = shareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Share not found"));

        if (!share.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("You cannot delete this share");
        }

        shareRepository.delete(share);
    }
}
