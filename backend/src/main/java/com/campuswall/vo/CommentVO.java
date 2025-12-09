package com.campuswall.vo;
import com.campuswall.dto.MediaItemRequest;
import com.campuswall.entity.Comment;
import com.campuswall.entity.User; // 假设你有User实体
import lombok.Data;
import org.springframework.beans.BeanUtils;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class CommentVO {
    // 复制 Comment 的基础字段
    private Long id;
    private Long postId;
    private String content;
    private Long parentId;
    private Long rootParentId;
    private String replyToUid;
    private Integer likeCount;
    private Integer replyCount;
    private Boolean isDeleted;
    private String createdAt;
    private String replyToNickname;

    // 图片列表
    private List<MediaItemRequest> images;

    //用户信息
    private String userNickname;
    private String userAvatar;
    private String userId;

    // 当前登录用户是否点赞
    private Boolean isLiked;

    public static CommentVO fromEntity(Comment comment, User user, boolean isLiked) {
        CommentVO vo = new CommentVO();
        BeanUtils.copyProperties(comment, vo);
        vo.setUserId(comment.getUid());

        // 处理图片
        if (comment.getMediaList() != null) {
            vo.setImages(comment.getMediaList().stream()
                .map(media -> new MediaItemRequest(media.getUrl(), media.getType(), media.getWidth(), media.getHeight()))
                    .collect(Collectors.toList())
            );
        }

        // 处理用户信息
        if (user != null) {
            vo.setUserNickname(user.getName());
            vo.setUserAvatar(user.getAvatar());
        }
         if (comment.getCreatedAt() != null) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        vo.setCreatedAt(comment.getCreatedAt().format(formatter));
        }
        vo.setIsLiked(isLiked);
        vo.setCreatedAt(comment.getCreatedAt().toString()); // 或格式化
        return vo;
    }
}