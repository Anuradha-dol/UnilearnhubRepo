package com.itpm.website.dtos.post;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CreatePostRequest {

    private String content;
    private MultipartFile image;
}