package com.itpm.website.controller.User;

import com.itpm.website.dtos.UserDto;
import com.itpm.website.dtos.post.MentionSuggestionResponse;
import com.itpm.website.enities.User;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.service.AuthService;
import com.itpm.website.service.user.UserProfileService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    @GetMapping("/mention-search")
    public ResponseEntity<List<MentionSuggestionResponse>> mentionSearch(
            @AuthenticationPrincipal User loggedUser,
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "limit", defaultValue = "8") int limit
    ) {
        if (loggedUser == null) {
            return ResponseEntity.status(401).body(List.of());
        }

        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        int safeLimit = Math.max(1, Math.min(limit, 20));

        List<User> matchedUsers = userRepo
                .findByFirstnameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByFirstnameAscLastNameAsc(
                        normalizedQuery,
                        normalizedQuery,
                        normalizedQuery,
                        PageRequest.of(0, safeLimit * 2)
                );

        Map<Long, MentionSuggestionResponse> deduped = new LinkedHashMap<>();
        for (User candidate : matchedUsers) {
            if (candidate.getUserId() == null || candidate.getUserId().equals(loggedUser.getUserId())) {
                continue;
            }

            String displayName = (candidate.getFirstname() + " " + candidate.getLastName()).trim();
            deduped.putIfAbsent(
                    candidate.getUserId(),
                    MentionSuggestionResponse.builder()
                            .userId(candidate.getUserId())
                            .displayName(displayName)
                            .email(candidate.getEmail())
                            .build()
            );
        }

        List<MentionSuggestionResponse> response = deduped.values()
                .stream()
                .limit(safeLimit)
                .toList();

        return ResponseEntity.ok(response);
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
