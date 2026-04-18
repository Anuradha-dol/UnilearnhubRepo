package com.itpm.website.controller.User;

import com.itpm.website.dtos.UserDto;
import com.itpm.website.enities.User;
import com.itpm.website.service.user.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public ResponseEntity<UserDto.UserProfileDto> getAdminProfile(@AuthenticationPrincipal User loggedUser) {
        return ResponseEntity.ok(userProfileService.getProfile(loggedUser.getUserId()));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<UserDto.UserHomeDto> getAdminHome(@AuthenticationPrincipal User loggedUser) {
        // loggedUser is automatically injected by Spring Security
        return ResponseEntity.ok(userProfileService.getUserHome(loggedUser.getUserId()));
    }
}
