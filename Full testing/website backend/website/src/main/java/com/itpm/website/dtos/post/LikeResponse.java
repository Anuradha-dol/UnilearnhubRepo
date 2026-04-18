package com.itpm.website.dtos.post;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LikeResponse {
    private Long postId;
    private String likedByName;
    private Date likedAt;



}
