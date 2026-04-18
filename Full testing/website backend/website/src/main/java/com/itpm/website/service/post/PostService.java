package com.itpm.website.service.post;

import com.itpm.website.dtos.user.Interest;
import com.itpm.website.enities.post.Post;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {

    Post createPost(Long userId, String content, MultipartFile imageFile, Interest learningPreference);

    void deletePost(Long postId);

    List<Post> getPostsByUser(Long userId);

    List<Post> getPostsByUser(Long userId, int limit);

    Post getPostById(Long postId);

    // Get all posts in the database (for feed/home page)
    List<Post> getAllPosts();

}