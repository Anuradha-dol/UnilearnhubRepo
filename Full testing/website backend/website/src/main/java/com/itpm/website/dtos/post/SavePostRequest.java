package com.itpm.website.dtos.post;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SavePostRequest {
    private Long collectionId;
    private String collectionName;
}
