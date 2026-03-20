package com.itpm.website.controller.User;

import com.itpm.website.dtos.UserDto;
import com.itpm.website.enities.User;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.service.AuthService;
import com.itpm.website.service.user.UserProfileService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final UserProfileService userProfileService;
    private final UserRepo userRepo;

    @PutMapping("/update-name")
    public ResponseEntity<String> updateName(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.UpdateNameDto dto) {

        userProfileService.updateName(loggedUser, dto);
        return ResponseEntity.ok("Name updated successfully");
    }

    @PutMapping("/update-email")
    public ResponseEntity<String> updateEmail(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.UpdateEmailDto dto) {

        userProfileService.updateEmail(loggedUser, dto);
        return ResponseEntity.ok("OTP sent to new email for verification");
    }

    @PostMapping("/verify-new-email")
    public ResponseEntity<String> verifyNewEmail(
            @AuthenticationPrincipal User loggedUser,
            @RequestParam String otp) {

        userProfileService.verifyNewEmail(loggedUser, otp);
        return ResponseEntity.ok("Email updated successfully");
    }

    @PutMapping("/update-password")
    public ResponseEntity<String> updatePassword(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.UpdatePasswordDto dto) {

        userProfileService.updatePassword(loggedUser, dto);
        return ResponseEntity.ok("Password updated successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto.UserProfileDto> getProfile(
            @AuthenticationPrincipal User loggedUser) {

        return ResponseEntity.ok(
                userProfileService.getProfile(loggedUser.getUserId())
        );
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/home")
    public ResponseEntity<UserDto.UserHomeDto> getHome(
            @AuthenticationPrincipal User loggedUser) {

        return ResponseEntity.ok(userProfileService.getUserHome(loggedUser.getUserId()));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<String> deleteAccount(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.DeleteAccountDto dto) {

        userProfileService.deleteAccount(loggedUser, dto);
        return ResponseEntity.ok("Account deleted successfully");
    }

    @PostMapping("/delete-forgot-request")
    public ResponseEntity<String> deleteForgotRequest(
            @AuthenticationPrincipal User loggedUser) {

        userProfileService.requestDeletion(loggedUser);
        return ResponseEntity.ok("OTP sent to your registered email. Verify to delete your account.");
    }

    @PostMapping("/delete-forgot-verify")
    public ResponseEntity<String> deleteForgotVerify(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.DeleteAccountForgotVerifyDto dto) {

        userProfileService.verifyAndDelete(loggedUser, dto);
        return ResponseEntity.ok("Account deleted successfully.");
    }

    @PostMapping("/upload-profile-image")
    public ResponseEntity<String> uploadProfileImage(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {

        String filename = "profile_" + user.getUserId() + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get("uploads/" + filename);
        Files.createDirectories(uploadPath.getParent());
        Files.write(uploadPath, file.getBytes());

        user.setImageUrl("/uploads/" + filename);
        userRepo.save(user);
        return ResponseEntity.ok(user.getImageUrl());
    }

    @PostMapping("/upload-cover-image")
    public ResponseEntity<String> uploadCoverImage(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {

        String filename = "cover_" + user.getUserId() + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get("uploads/" + filename);
        Files.createDirectories(uploadPath.getParent());
        Files.write(uploadPath, file.getBytes());

        user.setCoverImageUrl("/uploads/" + filename);
        userRepo.save(user);
        return ResponseEntity.ok(user.getCoverImageUrl());
    }
}
