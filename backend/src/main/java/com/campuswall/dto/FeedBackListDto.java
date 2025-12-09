package com.campuswall.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FeedBackListDto {
    private String title;
    private String content;
    private String uid;
    private String authorName;
    private String authorAvatar;
    private LocalDateTime createAt;
}
