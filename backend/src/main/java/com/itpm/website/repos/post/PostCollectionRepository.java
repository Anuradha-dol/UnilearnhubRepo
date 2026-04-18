package com.itpm.website.repos.post;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.itpm.website.enities.post.PostCollection;

public interface PostCollectionRepository extends JpaRepository<PostCollection, Long> {

    List<PostCollection> findByUser_UserIdOrderByNameAsc(Long userId);

    Optional<PostCollection> findByCollectionIdAndUser_UserId(Long collectionId, Long userId);

    Optional<PostCollection> findByUser_UserIdAndNameIgnoreCase(Long userId, String name);
}
