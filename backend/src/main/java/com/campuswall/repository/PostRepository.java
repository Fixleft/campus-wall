package com.campuswall.repository;

import com.campuswall.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
// ⚠️ 注意：这里泛型改成了 Long，因为你的 postId 是 Long 类型
public interface PostRepository extends JpaRepository<Post, Long> {

    // ==========================================
    // 1. 基础改动操作 (点赞/评论数)
    // ==========================================

    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :postId")
    void incrementLikeCount(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.likeCount = p.likeCount - 1 WHERE p.id = :postId")
    void decrementLikeCount(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.commentCount = p.commentCount + 1 WHERE p.id = :postId")
    void incrementCommentCount(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.commentCount = p.commentCount - 1 WHERE p.id = :postId AND p.commentCount > 0")
    void decrementCommentCount(@Param("postId") Long postId);


    // ==========================================
    // 2. 用户端查询 (User Client) - 必须过滤 status = 0
    // ==========================================

    // 查找单条帖子（如果被屏蔽了，普通用户也查不到）
    // 你可以在 Service 层处理：如果是管理员调用的 findById，则不做 status 限制
    Optional<Post> findById(Long id);

    @Query("SELECT p FROM Post p, User u " +
           "WHERE p.uid = u.uid " +
           "AND p.status = 0 " +         // 帖子未被屏蔽
           "AND u.enabled = true " +     // 作者未被封禁
           "ORDER BY p.createdAt DESC")
    Page<Post> findAllActivePosts(Pageable pageable);

    //给别人看的帖子列表（不包含屏蔽贴）
     @Query("SELECT p FROM Post p, User u " +
           "WHERE p.uid = u.uid " +
           "AND p.uid = :uid " +        // 指定目标用户
           "AND p.status = 0 " +        // 过滤屏蔽贴
           "AND u.enabled = true " +    // 过滤封禁用户
           "ORDER BY p.createdAt DESC")
    Page<Post> findActivePostsByUid(@Param("uid") String uid, Pageable pageable);

    // 查询自己的帖子列表（包含屏蔽贴）
    Page<Post> findByUidOrderByCreatedAtDesc(String uid, Pageable pageable);

    // 热门帖子：只查 status = 0
    @Query("SELECT p FROM Post p " +
           "WHERE p.status = 0 " + // <--- 关键过滤
           "ORDER BY (p.viewCount + p.likeCount + p.commentCount) DESC")
    Page<Post> findHotPosts(Pageable pageable);

    // 查询用户点赞的帖子：只查 status = 0 (防止用户看到已屏蔽的违规贴)
     @Query("SELECT p FROM Post p " +
           "JOIN UserLikesPost ulp ON p.id = ulp.id.postId " +
           "JOIN User u ON p.uid = u.uid " + // 关联帖子作者
           "WHERE ulp.id.userId = :uid " +   // 当前查看的用户
           "AND p.status = 0 " +
           "AND u.enabled = true " +         // 帖子作者未封禁
           "ORDER BY ulp.likedAt DESC")
    Page<Post> findLikedPostsByUid(@Param("uid") String uid, Pageable pageable);

    // 用户端搜索：只查 status = 0
    @Query("SELECT DISTINCT p FROM Post p " +
           "LEFT JOIN p.tags t, User u " +   // 隐式连接 User
           "WHERE p.uid = u.uid " +
           "AND p.status = 0 " +
           "AND u.enabled = true " +         // 过滤封禁用户
           "AND (" +
               "(p.content LIKE %:keyword%) OR " +
               "(t.name LIKE %:keyword%)" +
           ") " +
           "ORDER BY p.createdAt DESC")
    Page<Post> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);


    // ==========================================
    // 3. 管理端查询 (Admin Panel) - 动态筛选
    // ==========================================

    /**
     * 管理员全能搜索接口
     * @param keyword 搜索内容或作者名 (可选)
     * @param status  帖子状态 (可选，null=查所有, 0=正常, 1=屏蔽)
     */
   @Query("SELECT p FROM Post p WHERE " +
       // 使用 CONCAT 拼接 %，这是标准 JPQL 写法
       "(:keyword IS NULL OR p.content LIKE CONCAT('%', :keyword, '%') OR p.uid LIKE CONCAT('%', :keyword, '%')) " +
       "AND " +
       "(:status IS NULL OR p.status = :status)")
Page<Post> searchPostsForAdmin(@Param("keyword") String keyword,
                               @Param("status") Integer status,
                               Pageable pageable);

   long countByCreatedAtAfter(LocalDateTime dateTime);
}