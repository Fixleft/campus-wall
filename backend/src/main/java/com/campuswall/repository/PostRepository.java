package com.campuswall.repository;

import com.campuswall.entity.Post;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Integer> {
    // 在 PostRepository 里加上这两个方法
    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :postId")
    void incrementLikeCount(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.likeCount = p.likeCount - 1 WHERE p.id = :postId")
    void decrementLikeCount(@Param("postId") Long postId);
    Optional<Post> findById(Long id);
    // 根据用户 uid 查询帖子
    List<Post> findByUid(String uid);

    // 分页查询所有帖子，按创建时间倒序（最新）
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 根据 uid 分页查询，并强制按 createdAt 倒序排列
    Page<Post> findByUidOrderByCreatedAtDesc(String uid, Pageable pageable);

    @Query("SELECT p FROM Post p ORDER BY (p.viewCount + p.likeCount + p.commentCount) DESC")
    Page<Post> findHotPosts(Pageable pageable);

    // 根据内容关键字搜索
    Page<Post> findByContentContainingIgnoreCaseOrderByCreatedAtDesc(String keyword, Pageable pageable);

    // 根据标签查询帖子
    Page<Post> findDistinctByTags_NameOrderByCreatedAtDesc(String tagName, Pageable pageable);
}
