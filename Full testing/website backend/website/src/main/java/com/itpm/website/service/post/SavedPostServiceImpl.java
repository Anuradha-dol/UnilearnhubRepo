package com.itpm.website.service.post;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.itpm.website.dtos.post.FeedResponse;
import com.itpm.website.dtos.post.PostCollectionResponse;
import com.itpm.website.dtos.post.SavePostResponse;
import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import com.itpm.website.enities.post.PostCollection;
import com.itpm.website.enities.post.PostHashtag;
import com.itpm.website.enities.post.SavedPost;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.post.PostCollectionRepository;
import com.itpm.website.repos.post.PostHashtagRepository;
import com.itpm.website.repos.post.PostRepository;
import com.itpm.website.repos.post.SavedPostRepository;
import com.itpm.website.repos.post.ShareRepository;
import com.itpm.website.utils.UploadMediaResolver;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SavedPostServiceImpl implements SavedPostService {

    private static final String DEFAULT_COLLECTION_NAME = "Saved";

    private final SavedPostRepository savedPostRepository;
    private final PostCollectionRepository postCollectionRepository;
    private final PostRepository postRepository;
    private final UserRepo userRepo;
    private final ShareRepository shareRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final UploadMediaResolver uploadMediaResolver;

    @Override
    @Transactional
    public List<PostCollectionResponse> getCollections(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ensureDefaultCollection(user);

        List<PostCollection> collections = postCollectionRepository.findByUser_UserIdOrderByNameAsc(userId);
        return collections.stream()
                .map(collection -> PostCollectionResponse.builder()
                        .collectionId(collection.getCollectionId())
                        .name(collection.getName())
                        .postCount(savedPostRepository.countByCollection_CollectionId(collection.getCollectionId()))
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public PostCollectionResponse createCollection(Long userId, String rawName) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String normalizedName = normalizeCollectionName(rawName);

        PostCollection existing = postCollectionRepository
                .findByUser_UserIdAndNameIgnoreCase(userId, normalizedName)
                .orElse(null);

        if (existing != null) {
            return PostCollectionResponse.builder()
                    .collectionId(existing.getCollectionId())
                    .name(existing.getName())
                    .postCount(savedPostRepository.countByCollection_CollectionId(existing.getCollectionId()))
                    .build();
        }

        PostCollection created = postCollectionRepository.save(
                PostCollection.builder()
                        .user(user)
                        .name(normalizedName)
                        .build()
        );

        return PostCollectionResponse.builder()
                .collectionId(created.getCollectionId())
                .name(created.getName())
                .postCount(0L)
                .build();
    }

    @Override
    @Transactional
    public SavePostResponse savePost(Long userId, Long postId, Long collectionId, String collectionName) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        PostCollection targetCollection = resolveTargetCollection(user, collectionId, collectionName);

        SavedPost savedPost = savedPostRepository.findByUser_UserIdAndPost_PostId(userId, postId)
                .orElseGet(() -> SavedPost.builder().user(user).post(post).build());

        savedPost.setCollection(targetCollection);
        SavedPost persisted = savedPostRepository.save(savedPost);

        return SavePostResponse.builder()
                .postId(postId)
                .saved(true)
                .collectionId(targetCollection.getCollectionId())
                .collectionName(targetCollection.getName())
                .savedAt(persisted.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void unsavePost(Long userId, Long postId) {
        savedPostRepository.deleteByUser_UserIdAndPost_PostId(userId, postId);
    }

    @Override
    @Transactional
    public List<FeedResponse> getSavedPosts(Long userId, Long collectionId, int limit) {
        userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<SavedPost> savedPosts;

        if (collectionId == null) {
            savedPosts = savedPostRepository.findByUser_UserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, safeLimit));
        } else {
            postCollectionRepository.findByCollectionIdAndUser_UserId(collectionId, userId)
                    .orElseThrow(() -> new RuntimeException("Collection not found"));
            savedPosts = savedPostRepository.findByUser_UserIdAndCollection_CollectionIdOrderByCreatedAtDesc(
                    userId,
                    collectionId,
                    PageRequest.of(0, safeLimit)
            );
        }

        List<Long> postIds = savedPosts.stream().map(saved -> saved.getPost().getPostId()).distinct().toList();
        Map<Long, Long> shareCountsByPostId = buildShareCountByPostId(postIds);
        Map<Long, List<String>> hashtagsByPostId = loadHashtagsByPostIds(postIds);

        return savedPosts.stream()
                .map(saved -> {
                    Post post = saved.getPost();
                    return FeedResponse.builder()
                            .type("POST")
                            .postId(post.getPostId())
                            .authorName(post.getAuthorName())
                            .content(post.getContent())
                            .imageUrl(uploadMediaResolver.safeUploadUrl(post.getImageUrl()))
                            .learningPreference(post.getLearningPreference())
                            .createdAt(post.getCreatedAt())
                            .shareCount(shareCountsByPostId.getOrDefault(post.getPostId(), 0L))
                            .hashtags(hashtagsByPostId.getOrDefault(post.getPostId(), List.of()))
                            .build();
                })
                .toList();
    }

    @Override
    public List<Long> getSavedPostIds(Long userId) {
        return savedPostRepository.findSavedPostIdsByUserId(userId);
    }

    private PostCollection resolveTargetCollection(User user, Long collectionId, String collectionName) {
        if (collectionId != null) {
            return postCollectionRepository.findByCollectionIdAndUser_UserId(collectionId, user.getUserId())
                    .orElseThrow(() -> new RuntimeException("Collection not found"));
        }

        if (collectionName != null && !collectionName.isBlank()) {
            String normalizedName = normalizeCollectionName(collectionName);
            return postCollectionRepository.findByUser_UserIdAndNameIgnoreCase(user.getUserId(), normalizedName)
                    .orElseGet(() -> postCollectionRepository.save(
                            PostCollection.builder().user(user).name(normalizedName).build()
                    ));
        }

        return ensureDefaultCollection(user);
    }

    private PostCollection ensureDefaultCollection(User user) {
        return postCollectionRepository.findByUser_UserIdAndNameIgnoreCase(user.getUserId(), DEFAULT_COLLECTION_NAME)
                .orElseGet(() -> postCollectionRepository.save(
                        PostCollection.builder()
                                .user(user)
                                .name(DEFAULT_COLLECTION_NAME)
                                .build()
                ));
    }

    private String normalizeCollectionName(String rawName) {
        String name = rawName == null ? "" : rawName.trim();
        if (name.isBlank()) {
            throw new RuntimeException("Collection name is required");
        }
        if (name.length() > 80) {
            throw new RuntimeException("Collection name is too long");
        }
        return name;
    }

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
}
