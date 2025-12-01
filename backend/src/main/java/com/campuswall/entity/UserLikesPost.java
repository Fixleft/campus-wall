package com.campuswall.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_likes_post")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserLikesPost {

    @EmbeddedId
    private UserLikesPostId id;


    @Column(name = "liked_at", insertable = false, updatable = false)
    private LocalDateTime likedAt;  // 数据库自动生成，不需要手动设置

    // 方便创建点赞记录的构造器
    public UserLikesPost(String userId, Long postId) {
        this.id = new UserLikesPostId(userId, postId);
    }
}