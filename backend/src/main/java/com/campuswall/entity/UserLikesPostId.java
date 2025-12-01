package com.campuswall.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserLikesPostId implements Serializable {

    @Column(name = "user_id", length = 6, nullable = false)
    private String userId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    // 可选：方便调试
    @Override
    public String toString() {
        return "UserLikesPostId{" +
                "userId='" + userId + '\'' +
                ", postId=" + postId +
                '}';
    }
}