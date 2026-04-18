package com.itpm.website.dtos.post;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareResponse {
    private Long postId;               // original post id
    private String sharedByName;       // who shared
    private Date sharedAt;             // share timestamp
    private String caption;            // optional caption

    // For frontend to display original post inside shared post
    private Long originalPostId;
    private String originalContent;
    private String originalImageUrl;
    private String originalAuthorName;
}
