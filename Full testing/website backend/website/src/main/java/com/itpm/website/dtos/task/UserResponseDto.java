package com.itpm.website.dtos.task;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserResponseDto {
    private Long userId;
    private String firstname;
    private String lastName;
    private String email;
}
