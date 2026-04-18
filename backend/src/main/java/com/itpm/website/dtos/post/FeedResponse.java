package com.itpm.website.dtos.post;

import com.itpm.website.dtos.user.Interest;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FeedResponse {

    private String type; // "Post"  "share"

    private Long postId;
    private String authorName;
    private String content;
    private String imageUrl;
    private Interest learningPreference;
    private LocalDateTime createdAt;
    private Long shareCount;
    private List<String> hashtags;

    // For SHARE
    private Long originalPostId;
    private String sharedByName;
    private String shareCaption;
    private LocalDateTime sharedAt;
}
