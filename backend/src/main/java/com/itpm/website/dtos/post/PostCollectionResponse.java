package com.itpm.website.dtos.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PostCollectionResponse {
    private Long collectionId;
    private String name;
    private Long postCount;
}
