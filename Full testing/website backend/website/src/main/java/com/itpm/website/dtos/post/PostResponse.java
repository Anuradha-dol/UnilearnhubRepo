package com.itpm.website.dtos.post;

import java.time.LocalDateTime;
import java.util.List;

import com.itpm.website.dtos.user.Interest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {
    private Long postId;
    private String content;
    private String imageUrl;
    private Interest learningPreference;
    private String authorName;
    private LocalDateTime createdAt;
    private List<String> hashtags;
    private List<CommentResponse> comments; // all comments including replies
}
