package com.itpm.website.dtos;

import com.itpm.website.dtos.user.Interest;
import com.itpm.website.dtos.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UserDto {


    public record RegisterRequest(@NotBlank(message = "First name is required") String firstname,
                                  @NotBlank(message = "last name required") String lastName,
                                  @NotBlank(message = "email is required")
                                  @Email(message = "please provide valid email! ")
                                  String email,
                                  String tempEmail,
                                  @NotBlank(message = "phonenumber is required")
                                  String phoneNumber,
                                  Role role,
                                  @NotNull(message = "Interest is required") Interest interest,


                                  @NotBlank(message = "password is required") String password) {


    }

    public record ChangePassword(String password, String repeatPassword) {


    }


    // Delete account by confirming current password
    public record DeleteAccountDto(
            @NotBlank(message = "Current password is required")
            String currentPassword
    ) {
    }


    public record DeleteAccountForgotRequest(
            @NotBlank(message = "Email is required")
            String email
    ) {
    }


    // Verify OTP to actually delete account
    public record DeleteAccountForgotVerifyDto(
            @NotBlank(message = "OTP is required")
            String otp
    ) {
    }


    public record UpdateEmailDto(
            @NotBlank(message = "Email cannot be blank")
            @Email(message = "Provide a valid email")
            String newEmail
    ) {
    }


    public record UpdateNameDto(
            @NotBlank(message = "Name cannot be blank")
            String name
            , String lastName
    ) {
    }


    public record UpdatePasswordDto(
            @NotBlank(message = "Current password is required")
            String currentPassword,

            @NotBlank(message = "New password is required")
            @Size(min = 6, message = "Password must be at least 6 characters")
            String newPassword,

            @NotBlank(message = "Confirm password is required")
            String confirmPassword
    ) {
    }


    public record UserHomeDto(String welcomeMessage, int notifications, int tasks) {
    }



    public record UserProfileDto(Long id, String name, String email, String lastName, Role role, Interest interest,
                                 String phoneNumber, String tempEmail, String profileImageUrl, String coverImageUrl) {
    }


    public record VerifyCodeDto(


            @NotBlank(message = "Verification code is required")
            String verifyCode
    ) {
    }


}
