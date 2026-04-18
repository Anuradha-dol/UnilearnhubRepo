package com.itpm.website.service.post;

import com.itpm.website.dtos.post.LikeActionResponse;

import java.util.Map;

public interface ReactionService {
    LikeActionResponse reactToPost(Long userId, Long postId, String type);
    LikeActionResponse removeReaction(Long userId, Long postId);
    Map<String, Long> getReactionCounts(Long postId); // returns counts per type

}

