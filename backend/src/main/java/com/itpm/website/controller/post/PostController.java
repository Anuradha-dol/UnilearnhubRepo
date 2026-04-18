package com.itpm.website.controller.post;

import java.util.List;
import java.util.Locale;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.itpm.website.dtos.post.PostResponse;
import com.itpm.website.dtos.user.Interest;
import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import com.itpm.website.repos.post.PostHashtagRepository;
import com.itpm.website.service.post.PostService;
import com.itpm.website.utils.UploadMediaResolver;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final UploadMediaResolver uploadMediaResolver;
    private final PostHashtagRepository postHashtagRepository;

    @PostMapping("/create")
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "learningPreference") String learningPreferenceValue) {

        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        if (content.isBlank() && (image == null || image.isEmpty())) {
            return ResponseEntity.badRequest().body(null);
        }

        Interest learningPreference;
        try {
            learningPreference = Interest.valueOf(learningPreferenceValue.trim().toUpperCase());
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(null);
        }

        Post post = postService.createPost(user.getUserId(), content, image, learningPreference);

        PostResponse response = PostResponse.builder()
                .postId(post.getPostId())
                .content(post.getContent())
                .imageUrl(uploadMediaResolver.safeUploadUrl(post.getImageUrl()))
                .learningPreference(post.getLearningPreference())
                .authorName(post.getUser().getFirstname() + " " + post.getUser().getLastName())
                .createdAt(post.getCreatedAt())
                .hashtags(loadHashtags(post.getPostId()))
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete/{postId}")
    public ResponseEntity<String> deletePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId) {

        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Post post = postService.getPostById(postId);

        if (!post.getUser().getUserId().equals(user.getUserId())) {
            return ResponseEntity.status(403).body("Cannot delete others' posts");
        }

        try {

            postService.deletePost(postId);
            return ResponseEntity.ok("Post deleted successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Cannot delete post: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<PostResponse>> getMyPosts(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "limit", defaultValue = "30") int limit) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        List<Post> posts = postService.getPostsByUser(user.getUserId(), limit);

        List<PostResponse> responses = posts.stream()
                .map(p -> PostResponse.builder()
                        .postId(p.getPostId())
                        .content(p.getContent())
                        .imageUrl(uploadMediaResolver.safeUploadUrl(p.getImageUrl()))
                        .learningPreference(p.getLearningPreference())
                        .authorName(p.getUser().getFirstname() + " " + p.getUser().getLastName())
                        .createdAt(p.getCreatedAt())
                        .hashtags(loadHashtags(p.getPostId()))
                        .build())
                .toList();

        return ResponseEntity.ok(responses);
    }



    @GetMapping("/feed")
    public ResponseEntity<List<PostResponse>> getFeedPosts(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }


        List<Post> feedPosts = postService.getAllPosts();

        List<PostResponse> responses = feedPosts.stream()
                .map(p -> PostResponse.builder()
                        .postId(p.getPostId())
                        .content(p.getContent())
                        .imageUrl(uploadMediaResolver.safeUploadUrl(p.getImageUrl()))
                        .learningPreference(p.getLearningPreference())
                        .authorName(p.getUser().getFirstname() + " " + p.getUser().getLastName())
                        .createdAt(p.getCreatedAt())
                        .hashtags(loadHashtags(p.getPostId()))
                        .build())
                .toList();

        return ResponseEntity.ok(responses);
    }

    private List<String> loadHashtags(Long postId) {
        return postHashtagRepository.findByPost_PostIdOrderByTagAsc(postId)
                .stream()
                .map(tag -> "#" + tag.getTag().toLowerCase(Locale.ROOT))
                .toList();
    }
}
