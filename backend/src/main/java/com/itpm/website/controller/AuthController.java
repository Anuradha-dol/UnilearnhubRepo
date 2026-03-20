package com.itpm.website.controller;

import com.itpm.website.dtos.UserDto;
import com.itpm.website.dtos.user.AuthResponse;
import com.itpm.website.dtos.user.LoginRequest;
import com.itpm.website.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody UserDto.RegisterRequest registerRequest,
                                                 HttpServletResponse response) {
        AuthResponse res = authService.signUp(registerRequest);

        Cookie emailCookie = new Cookie("userEmail", registerRequest.email());
        emailCookie.setHttpOnly(true);
        emailCookie.setPath("/");
        emailCookie.setMaxAge(30 * 60);
        emailCookie.setSecure(false);
        emailCookie.setDomain("localhost");

        response.addCookie(emailCookie);

        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest,
                                              HttpServletResponse response) {
        return ResponseEntity.ok(authService.SignIn(loginRequest, response));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<AuthResponse> verifyCode(@Valid @RequestBody UserDto.VerifyCodeDto verifyCodeDto,
                                                   HttpServletRequest request) {

        String email = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("userEmail".equals(c.getName())) {
                    email = c.getValue();
                    break;
                }
            }
        }

        if (email == null) {
            return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                            .message("Email not found. Please start the process again.")
                            .success(false)
                            .build());
        }
        String verifyCode = verifyCodeDto.verifyCode();

        return ResponseEntity.ok(authService.verifyCode(email, verifyCode));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<AuthResponse> resendOtp(HttpServletRequest request) {

        String email = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("userEmail".equals(c.getName())) {
                    email = c.getValue();
                    break;
                }
            }
        }

        if (email == null) {
            return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                            .message("Email not found. Please start the process again.")
                            .success(false)
                            .build());
        }

        return ResponseEntity.ok(authService.resendOtp(email));
    }
}