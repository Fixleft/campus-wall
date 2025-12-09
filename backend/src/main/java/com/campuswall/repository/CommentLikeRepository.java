package com.campuswall.repository;

import com.campuswall.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    // 判断用户是否给某条评论点过赞
    boolean existsByCommentIdAndUid(Long commentId, String uid);

    // 取消点赞（删除记录）
    @Transactional
    void deleteByCommentIdAndUid(Long commentId, String uid);
}