package com.campuswall.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "comment_media")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    // 图片/文件在 MinIO 中的完整 URL
    @Column(name = "url", nullable = false, length = 500)
    private String url;

    // 媒体类型 (可选，如果以后要支持视频，可以用这个字段区分：0=img, 1=video)
    @Column(name = "type", nullable = false, length = 20)
    private String type = "Image";

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    // 关联 Comment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    @JsonIgnore // 关键：序列化 CommentMedia 时不要带出 Comment，防止无限递归
    private Comment comment;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // 构造方法，方便快速创建
    public CommentMedia(String url, Comment comment) {
        this.url = url;
        this.comment = comment;
    }
}