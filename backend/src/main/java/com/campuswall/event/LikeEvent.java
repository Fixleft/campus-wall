package com.campuswall.event;

import com.campuswall.enums.NotificationType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class LikeEvent extends ApplicationEvent {

    private final String senderUid;   // 点赞的人
    private final String receiverUid; // 被点赞的人(帖子作者或评论作者)
    private final Long postId;        // 帖子ID
    private final Long commentId;     // 评论ID (如果是赞帖子，这里为null)
    private final NotificationType type;

    public LikeEvent(Object source, String senderUid, String receiverUid, Long postId, Long commentId, NotificationType type) {
        super(source);
        this.senderUid = senderUid;
        this.receiverUid = receiverUid;
        this.postId = postId;
        this.commentId = commentId;
        this.type = type;
    }
}