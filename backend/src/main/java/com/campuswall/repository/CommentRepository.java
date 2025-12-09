package com.campuswall.repository;

import com.campuswall.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // ================= Atomic Updates (原子更新) =================

    // 评论点赞数 +1
    @Modifying
    @Transactional
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount + 1 WHERE c.id = :commentId")
    void incrementLikeCount(@Param("commentId") Long commentId);

    // 评论点赞数 -1
    @Modifying
    @Transactional
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount - 1 WHERE c.id = :commentId AND c.likeCount > 0")
    void decrementLikeCount(@Param("commentId") Long commentId);

    // 评论回复数 +1 (用于当有人回复某条评论时，更新父评论的 replyCount)
    @Modifying
    @Transactional
    @Query("UPDATE Comment c SET c.replyCount = c.replyCount + 1 WHERE c.id = :commentId")
    void incrementReplyCount(@Param("commentId") Long commentId);

    // ================= Query Methods (查询方法) =================

    /**
     * 1. 查询帖子下的一级评论（楼层）
     * 场景：帖子详情页，只加载 parent_id = 0 (或 root_parent_id = 0) 的评论
     * 排序：按点赞数倒序（热评），如果点赞相同按时间倒序
     */
    @Query("SELECT c FROM Comment c WHERE c.postId = :postId AND c.rootParentId = 0 ORDER BY c.likeCount DESC, c.createdAt DESC")
    Page<Comment> findFloorsByPostId(@Param("postId") Long postId, Pageable pageable);

    /**
     * 2. 查询某个楼层下的所有子回复
     * 场景：点击“查看更多回复”展开楼中楼
     * 排序：按时间正序 (Asc)，还原对话的时间线
     */
    List<Comment> findByRootParentIdOrderByCreatedAtAsc(Long rootParentId);

    /**
     * 3. 查询用户的历史评论
     * 场景：个人中心 -> 我的评论
     */
    Page<Comment> findByUidOrderByCreatedAtDesc(String uid, Pageable pageable);

    /**
     * 4. 统计某帖子的总评论数 (用于校验或后台统计)
     * 注意：Post表里通常有冗余字段 commentCount，这个方法用于校准
     */
    long countByPostId(Long postId);

    @Query("SELECT c FROM Comment c WHERE " +
           "(:postId IS NULL OR c.postId = :postId) " +
           "AND (:keyword IS NULL OR c.content LIKE %:keyword% OR c.uid LIKE %:keyword%) ")
    Page<Comment> searchCommentsForAdmin(@Param("postId") Long postId,
                                         @Param("keyword") String keyword,
                                         Pageable pageable);

    long countByCreatedAtAfter(LocalDateTime dateTime);
}