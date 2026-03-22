package com.itpm.website.dtos.post;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {
    private Long postId;
    private String content;
    private String imageUrl;
    private String authorName;
    private LocalDateTime createdAt;
    private List<CommentResponse> comments; // all comments including replies
}
