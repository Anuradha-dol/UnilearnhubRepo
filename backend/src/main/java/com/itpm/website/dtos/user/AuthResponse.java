package com.itpm.website.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public final class AuthResponse {

    private String firstname;
    private String lastName;
    private String email;

    private String phoneNumber;
    private String accessToken;
    private String refreshToken;
    private String tempEmail;
    private boolean isVerified;
    private Role role;
    private boolean success;
    private String message;
    private String token;
}