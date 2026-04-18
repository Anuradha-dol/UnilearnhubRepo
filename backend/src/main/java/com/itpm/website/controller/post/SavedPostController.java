package com.itpm.website.controller.post;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.itpm.website.dtos.post.FeedResponse;
import com.itpm.website.dtos.post.PostCollectionRequest;
import com.itpm.website.dtos.post.PostCollectionResponse;
import com.itpm.website.dtos.post.SavePostRequest;
import com.itpm.website.dtos.post.SavePostResponse;
import com.itpm.website.enities.User;
import com.itpm.website.service.post.SavedPostService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/saved-posts")
@RequiredArgsConstructor
public class SavedPostController {

    private final SavedPostService savedPostService;

    @GetMapping("/collections")
    public ResponseEntity<List<PostCollectionResponse>> getCollections(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        return ResponseEntity.ok(savedPostService.getCollections(user.getUserId()));
    }

    @PostMapping("/collections")
    public ResponseEntity<PostCollectionResponse> createCollection(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PostCollectionRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        return ResponseEntity.ok(savedPostService.createCollection(user.getUserId(), request.getName()));
    }

    @PostMapping("/{postId}")
    public ResponseEntity<SavePostResponse> savePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestBody(required = false) SavePostRequest request
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        Long collectionId = request != null ? request.getCollectionId() : null;
        String collectionName = request != null ? request.getCollectionName() : null;

        SavePostResponse response = savedPostService.savePost(
                user.getUserId(),
                postId,
                collectionId,
                collectionName
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> unsavePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId
    ) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        savedPostService.unsavePost(user.getUserId(), postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<FeedResponse>> getSavedPosts(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "collectionId", required = false) Long collectionId,
            @RequestParam(value = "limit", defaultValue = "50") int limit
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        return ResponseEntity.ok(savedPostService.getSavedPosts(user.getUserId(), collectionId, limit));
    }

    @GetMapping("/ids")
    public ResponseEntity<Map<String, List<Long>>> getSavedPostIds(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        return ResponseEntity.ok(Map.of("savedPostIds", savedPostService.getSavedPostIds(user.getUserId())));
    }
}
