package com.itpm.website.controller.post;

import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.itpm.website.dtos.post.LikeActionResponse;
import com.itpm.website.enities.User;
import com.itpm.website.service.post.ReactionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @PostMapping("/{postId}")
    public ResponseEntity<LikeActionResponse> react(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam String type) {

        if (user == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Please login to react");
        }

        try {
            return ResponseEntity.ok(reactionService.reactToPost(user.getUserId(), postId, type));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(BAD_REQUEST, ex.getMessage());
        }
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<LikeActionResponse> removeReaction(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId) {

        return ResponseEntity.ok(reactionService.removeReaction(user.getUserId(), postId));
    }

    @GetMapping("/{postId}/counts")
    public ResponseEntity<Map<String, Long>> getReactionCounts(@PathVariable Long postId) {
        return ResponseEntity.ok(reactionService.getReactionCounts(postId));
    }
}
