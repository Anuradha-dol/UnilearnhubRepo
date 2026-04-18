package com.itpm.website.controller.problemsreview;

import com.itpm.website.dtos.problemsreview.ReviewDto;
import com.itpm.website.enities.User;
import com.itpm.website.enities.problemsreview.Review;
import com.itpm.website.service.problemsreview.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;


    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/gets")
    public ResponseEntity<List<Review>> getMyReviews(
            @AuthenticationPrincipal User loggedUser) {

        return ResponseEntity.ok(
                reviewService.getReviewsByUserId(loggedUser.getUserId())
        );
    }



    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<Review> createReview(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody ReviewDto.CreateReviewDto dto) {

        Review review = new Review();
        review.setComment(dto.comment());
        review.setRating(dto.rating());
        review.setStatus(dto.status());
        review.setUserId(loggedUser.getUserId());
        review.setUsername(loggedUser.getFirstname() + " " + loggedUser.getLastName());

        return ResponseEntity.ok(reviewService.createReview(review));
    }


    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(
            @AuthenticationPrincipal User loggedUser,
            @PathVariable Long id,
            @Valid @RequestBody ReviewDto.UpdateReviewDto dto) {

        Review updated = reviewService.updateReview(id, dto, loggedUser.getUserId());
        return ResponseEntity.ok(updated);
    }


    @PreAuthorize("hasRole('USER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteReview(
            @AuthenticationPrincipal User loggedUser,
            @PathVariable Long id) {

        reviewService.deleteReview(id, loggedUser.getUserId());
        return ResponseEntity.ok("Review deleted successfully");
    }



}