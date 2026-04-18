package com.itpm.website.dtos.post;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SavePostResponse {
    private Long postId;
    private boolean saved;
    private Long collectionId;
    private String collectionName;
    private LocalDateTime savedAt;
}
