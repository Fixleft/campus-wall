package com.campuswall.entity;

import com.campuswall.enums.NotificationType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "notification", indexes = {
    @Index(name = "idx_receiver_uid", columnList = "receiver_uid"), // 查询我的消息
    @Index(name = "idx_is_read", columnList = "is_read")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 接收通知的人 (被点赞/被评论的人)
    @Column(name = "receiver_uid", nullable = false)
    private String receiverUid;

    // 发起操作的人 (点赞者/评论者)
    @Column(name = "sender_uid", nullable = false)
    private String senderUid;

    // 类型：LIKE_POST, LIKE_COMMENT, COMMENT_POST, REPLY_COMMENT
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    // 关联的帖子ID (方便前端点击跳转)
    @Column(name = "post_id")
    private Long postId;

    // 关联的评论ID (如果是对评论的操作)
    @Column(name = "comment_id")
    private Long commentId;

    // 预览内容 (如果是评论，存前几十个字；如果是点赞，可为空)
    @Column(length = 255)
    private String content;

    @Column(name = "is_read")
    private Boolean isRead = false;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}