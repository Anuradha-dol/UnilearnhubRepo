package com.itpm.website.dtos.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostCollectionRequest {

    @NotBlank(message = "Collection name is required")
    @Size(max = 80, message = "Collection name must be at most 80 characters")
    private String name;
}
