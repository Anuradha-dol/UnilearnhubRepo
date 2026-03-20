package com.itpm.website.service;

import com.itpm.website.dtos.UserDto;
import com.itpm.website.dtos.user.AuthResponse;
import com.itpm.website.dtos.user.LoginRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {



    AuthResponse signUp(UserDto.RegisterRequest  registerRequest);

    AuthResponse SignIn(LoginRequest loginRequest, HttpServletResponse response);

    AuthResponse verifyCode(String email, String verifyCode);


    AuthResponse resendOtp(String email);


}