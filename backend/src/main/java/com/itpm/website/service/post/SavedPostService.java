package com.itpm.website.service.post;

import java.util.List;

import com.itpm.website.dtos.post.FeedResponse;
import com.itpm.website.dtos.post.PostCollectionResponse;
import com.itpm.website.dtos.post.SavePostResponse;

public interface SavedPostService {

    List<PostCollectionResponse> getCollections(Long userId);

    PostCollectionResponse createCollection(Long userId, String rawName);

    SavePostResponse savePost(Long userId, Long postId, Long collectionId, String collectionName);

    void unsavePost(Long userId, Long postId);

    List<FeedResponse> getSavedPosts(Long userId, Long collectionId, int limit);

    List<Long> getSavedPostIds(Long userId);
}
