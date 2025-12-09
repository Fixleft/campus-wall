package com.campuswall.dto;
import lombok.Data;
import java.util.List;

@Data
public class CommentRequest {
    private Long postId;
    private String content;
    private List<MediaItemRequest> images; // 图片URL列表
    private Long parentId;          // 0=楼层，>0=回复
    private String replyToUid;      // 被回复的人UID
}