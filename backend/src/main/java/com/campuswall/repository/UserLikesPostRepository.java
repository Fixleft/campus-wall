package com.campuswall.repository;

import com.campuswall.entity.UserLikesPost;
import com.campuswall.entity.UserLikesPostId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface UserLikesPostRepository extends JpaRepository<UserLikesPost, UserLikesPostId> {

    // 检查是否已点赞
    boolean existsById_UserIdAndId_PostId(String userId, Long postId);

    // 可选：统计某个帖子的总点赞数（性能更好）
    long countById_PostId(Long postId);

    // 查询某用户的所有点赞帖子
    List<UserLikesPost> findById_UserId(Long userId);

    @Modifying
    @Transactional
    void deleteById_PostId(Long postId);
}