package com.itpm.website.dtos.post;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommentResponse {
    private Long commentId;
    private String content;
    private String attachmentUrl;
    private String authorName;
    private LocalDateTime createdAt;
    private List<CommentResponse> replies;
}
