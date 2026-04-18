package com.itpm.website.repos.post;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.itpm.website.enities.post.Post;
import com.itpm.website.enities.post.PostHashtag;

public interface PostHashtagRepository extends JpaRepository<PostHashtag, Long> {

    List<PostHashtag> findByPost_PostIdOrderByTagAsc(Long postId);

    List<PostHashtag> findByPost_PostIdIn(Collection<Long> postIds);

    @Query("select ph.post from PostHashtag ph where ph.tag = :tag order by ph.post.createdAt desc")
    List<Post> findPostsByTag(@Param("tag") String tag, Pageable pageable);
}
