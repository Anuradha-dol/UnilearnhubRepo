package com.itpm.website.service.post;

import com.itpm.website.enities.User;
import com.itpm.website.enities.post.Post;
import com.itpm.website.repos.UserRepo;
import com.itpm.website.repos.post.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepo userRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public Post createPost(Long userId, String content, MultipartFile imageFile) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = null;

        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                File folder = new File(uploadDir).getAbsoluteFile();
                if (!folder.exists()) folder.mkdirs();

                String originalFilename = imageFile.getOriginalFilename();
                String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                String filename = UUID.randomUUID() + extension;

                File dest = new File(folder, filename);
                imageFile.transferTo(dest);

                imageUrl = "/uploads/" + filename;
            } catch (IOException e) {
                e.printStackTrace();
                throw new RuntimeException("Failed to save image", e);
            }
        }

        Post post = Post.builder()
                .user(user)
                .content(content)
                .imageUrl(imageUrl)
                .createdAt(LocalDateTime.now())
                .build();

        return postRepository.save(post);
    }

    @Override
    public void deletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        postRepository.delete(post);
    }

    @Override
    public List<Post> getPostsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return postRepository.findByUser(user);
    }

    @Override
    public Post getPostById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    @Override
    public List<Post> getAllPosts() {
        // Return all posts in the database, newest first
        List<Post> allPosts = postRepository.findAll();
        allPosts.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return allPosts;
    }

}