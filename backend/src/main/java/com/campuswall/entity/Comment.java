package com.campuswall.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "comment", indexes = {
        @Index(name = "idx_post_root", columnList = "post_id, root_parent_id"), // 核心索引：用于查询帖子下的楼层
        @Index(name = "idx_uid", columnList = "uid") // 用于查询用户历史评论
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    // --- 关联外键 ---

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "uid", nullable = false, length = 6)
    private String uid;

    // --- 核心内容 ---

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    // --- 层级结构 (关键) ---

    /**
     * 父评论ID。
     * 0 = 一级评论 (直接评论帖子)
     * >0 = 回复某条评论
     */
    @Column(name = "parent_id", nullable = false)
    private Long parentId = 0L;

    /**
     * 根评论ID (楼层ID)。
     * 如果是一级评论，此值为 0 (或者存自身ID，看业务习惯，建议存0方便区分)。
     * 如果是二级/三级回复，此值永远是它们所属的那个一级评论的 ID。
     * 作用：select * from comment where root_parent_id = ? 可以直接查出楼层下的所有回复。
     */
    @Column(name = "root_parent_id", nullable = false)
    private Long rootParentId = 0L;

    /**
     * 被回复的人的UID。
     * 用于前端展示： "回复 @User123 : 此时此刻..."
     */
    @Column(name = "reply_to_uid", length = 6)
    private String replyToUid;

    // --- 统计与状态 ---

    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "reply_count", nullable = false)
    private Integer replyCount = 0;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "tinyint(1) default 0")
    private Boolean isDeleted = false;


    // --- 关联关系 ---

    // 1. 评论图片：一对多关联
    // cascade = ALL: 保存Comment时自动保存Media，删除Comment时自动删除Media
    // orphanRemoval = true: 从列表中移除Media对象时，数据库也会删除对应记录
    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("comment") // 防止序列化时死循环
    private List<CommentMedia> mediaList = new ArrayList<>();

    // 2. 关联用户 (只查询用)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uid", insertable = false, updatable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User user;

    // --- 时间字段 ---

    @Column(nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime updatedAt;

    // --- 生命周期回调 ---

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // --- 辅助方法 ---

    // 方便在代码中添加图片并维持双向关系
    public void addMedia(CommentMedia media) {
        mediaList.add(media);
        media.setComment(this);
    }
}