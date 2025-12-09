package com.campuswall.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "post_media")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 500)
    private String coverUrl;


    @Column(name = "width")
    private Integer width;


    @Column(name = "height")
    private Integer height;
    // === 新增部分结束 ===

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;
}
