package com.itpm.website.service.post;

import java.util.List;

import com.itpm.website.dtos.post.FeedResponse;
import com.itpm.website.enities.post.Share;

public interface ShareService {
    Share sharePost(Long userId, Long postId, String caption);

    List<FeedResponse> getFullFeed();

    List<FeedResponse> getMyShares(Long userId);

    void deleteShare(Long userId, Long shareId);


}
