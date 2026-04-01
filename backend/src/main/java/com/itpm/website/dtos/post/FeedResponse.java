package com.itpm.website.dtos.post;

import java.time.LocalDateTime;

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
    private LocalDateTime createdAt;
    private Long shareCount;

    // For SHARE
    private Long originalPostId;
    private String sharedByName;
    private String shareCaption;
    private LocalDateTime sharedAt;
}
