package com.itpm.website.dtos.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MentionSuggestionResponse {
    private Long userId;
    private String displayName;
    private String email;
}
