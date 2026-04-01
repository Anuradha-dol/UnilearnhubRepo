package com.itpm.website.controller.post;

import java.util.List;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.itpm.website.dtos.post.FeedResponse;
import com.itpm.website.dtos.post.ShareRequest;
import com.itpm.website.dtos.post.ShareResponse;
import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Share;
import com.itpm.website.service.post.ShareService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/shares")
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;


    @PostMapping("/{postId}/share")
    public ResponseEntity<ShareResponse> sharePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestBody(required = false) ShareRequest request) {

        Share share = shareService.sharePost(
                user.getUserId(),
                postId,
                request != null ? request.getCaption() : null
        );

        ShareResponse response = ShareResponse.builder()
                .postId(share.getShareId())
                .sharedByName(user.getFirstname() + " " + user.getLastName())
            .sharedAt(java.sql.Timestamp.valueOf(share.getCreatedAt()))
                .caption(share.getCaption())
                .originalPostId(share.getPost().getPostId())
                .originalContent(share.getPost().getContent())
                .originalImageUrl(share.getPost().getImageUrl())
                .originalAuthorName(share.getPost().getAuthorName())
                .build();

        return ResponseEntity.ok(response);
    }


    @GetMapping("/feed")
    public ResponseEntity<List<FeedResponse>> getFeed() {
        return ResponseEntity.ok(shareService.getFullFeed());
    }

    @GetMapping("/my")
    public ResponseEntity<List<FeedResponse>> getMyShares(@AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Please login first");
        }
        return ResponseEntity.ok(shareService.getMyShares(user.getUserId()));
    }


    @DeleteMapping("/{shareId}")
    public ResponseEntity<?> deleteShare(
            @AuthenticationPrincipal User user,
            @PathVariable Long shareId) {

        shareService.deleteShare(user.getUserId(), shareId);
        return ResponseEntity.ok("Share deleted successfully");
    }
}