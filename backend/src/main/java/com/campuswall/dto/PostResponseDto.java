package com.campuswall.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostResponseDto {
    private boolean isOwner;
    private Long id;
    private String content;
    private String location;
    private boolean isAnonymous;


    private String authorName;
    private String authorAvatar;
    private String authorUid;

    private int likeCount;
    private int commentCount;
    private int viewCount;

    private List<PostMediaDto> mediaUrls;
    private List<String> tags;

    private boolean isLiked;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Shanghai")
    private LocalDateTime createdAt;

    public boolean isLiked() { return isLiked; }
    public void setIsLiked(boolean isLiked) { this.isLiked = isLiked; }
}
