package com.campuswall.repository;

import com.campuswall.entity.UserLikesPost;
import com.campuswall.entity.UserLikesPostId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

public interface UserLikesPostRepository extends JpaRepository<UserLikesPost, UserLikesPostId> {

    // 检查是否已点赞
    boolean existsById_UserIdAndId_PostId(String userId, Long postId);

    // 可选：统计某个帖子的总点赞数（性能更好）
    long countById_PostId(Long postId);

    @Query("SELECT ul.id.postId FROM UserLikesPost ul WHERE ul.id.userId = :uid AND ul.id.postId IN :postIds")
    Set<Long> findLikedPostIdsByUidAndPostIds(@Param("uid") String uid, @Param("postIds") List<Long> postIds);

    @Modifying
    @Transactional
    void deleteById_PostId(Long postId);
}