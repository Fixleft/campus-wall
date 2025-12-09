package com.campuswall.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "comment_like", uniqueConstraints = {
        @UniqueConstraint(name = "uk_comment_uid", columnNames = {"comment_id", "uid"}) // 防止重复点赞
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "comment_id", nullable = false)
    private Long commentId;

    @Column(name = "uid", nullable = false, length = 6)
    private String uid;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // 构造函数方便 new
    public CommentLike(Long commentId, String uid) {
        this.commentId = commentId;
        this.uid = uid;
    }
}