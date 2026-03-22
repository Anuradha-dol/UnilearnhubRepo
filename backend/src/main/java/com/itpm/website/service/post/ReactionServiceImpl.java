package com.itpm.website.service.post;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.itpm.website.dtos.post.LikeActionResponse;
import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import com.itpm.website.enities.post.Reaction;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.post.PostRepository;
import com.itpm.website.repos.post.ReactionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {

    private static final Set<String> ALLOWED_TYPES = Set.of("like", "love", "care", "haha", "wow", "sad", "angry");

    private final ReactionRepository reactionRepository;
    private final UserRepo userRepo;
    private final PostRepository postRepo;

    @Override
    public LikeActionResponse reactToPost(Long userId, Long postId, String type) {
        User user = userRepo.findById(userId).orElseThrow();
        Post post = postRepo.findById(postId).orElseThrow();
        String normalizedType = type == null ? "" : type.trim().toLowerCase();

        if (!ALLOWED_TYPES.contains(normalizedType)) {
            throw new IllegalArgumentException("Unsupported reaction type: " + type);
        }

        // Remove previous reaction if exists
        reactionRepository.findByUserAndPost(user, post).ifPresent(reactionRepository::delete);

        Reaction reaction = Reaction.builder()
                .user(user)
                .post(post)
            .type(normalizedType)
                .build();

        reactionRepository.save(reaction);

        return new LikeActionResponse("Reacted with " + normalizedType);
    }

    @Override
    public LikeActionResponse removeReaction(Long userId, Long postId) {
        User user = userRepo.findById(userId).orElseThrow();
        Post post = postRepo.findById(postId).orElseThrow();

        reactionRepository.findByUserAndPost(user, post)
                .ifPresent(reactionRepository::delete);

        return new LikeActionResponse("Reaction removed");
    }

    @Override
    public Map<String, Long> getReactionCounts(Long postId) {
        Post post = postRepo.findById(postId).orElseThrow();

        Map<String, Long> counts = new HashMap<>();
        String[] types = {"like", "love", "care", "haha", "wow", "sad", "angry"};

        for (String type : types) {
            counts.put(type, reactionRepository.countByPostAndType(post, type));
        }

        return counts;
    }
}
