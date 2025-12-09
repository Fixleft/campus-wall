package com.campuswall.listener;

import com.campuswall.entity.Comment;
import com.campuswall.entity.Notification;
import com.campuswall.entity.Post;
import com.campuswall.enums.NotificationType;
import com.campuswall.event.CommentCreatedEvent;
import com.campuswall.event.LikeEvent;
import com.campuswall.event.PrivateMessageEvent;
import com.campuswall.repository.CommentRepository;
import com.campuswall.repository.NotificationRepository;
import com.campuswall.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final NotificationRepository notificationRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    /**
     * 处理点赞事件
     */
    @Async
    @EventListener
    public void handleLikeEvent(LikeEvent event) {
        // 自己给自己点赞，不发通知
        if (event.getSenderUid().equals(event.getReceiverUid())) {
            return;
        }

        saveNotification(
            event.getReceiverUid(),
            event.getSenderUid(),
            event.getType(),
            event.getPostId(),
            event.getCommentId(),
            null // 点赞不需要内容预览
        );
    }

    /**
     * 处理评论事件 (复用之前的事件)
     */
    @Async
    @EventListener
    public void handleCommentEvent(CommentCreatedEvent event) {
        Comment comment = event.getComment();
        String senderUid = comment.getUid();

        // 1. 获取帖子信息
        Post post = postRepository.findById(comment.getPostId()).orElse(null);
        if (post == null) return;

        // 逻辑A：评论了帖子 (一级评论) -> 通知帖子作者
        if (comment.getParentId() == 0L || comment.getParentId() == null) {
            String receiverUid = post.getUid();

            // 自己评论自己帖子，不通知
            if (!senderUid.equals(receiverUid)) {
                saveNotification(receiverUid, senderUid, NotificationType.COMMENT_POST, post.getId(), comment.getId(), comment.getContent());
            }
        }
        // 逻辑B：回复了别人的评论 (二级评论) -> 通知被回复的人
        else {
            // 这里我们需要知道回复了谁。
            // 简单做法：查出父评论的作者
            // 精确做法：如果你存了 replyToUid，直接用它
            String receiverUid = comment.getReplyToUid();

            if (receiverUid != null && !senderUid.equals(receiverUid)) {
                saveNotification(receiverUid, senderUid, NotificationType.REPLY_COMMENT, post.getId(), comment.getId(), comment.getContent());
            }
        }
    }

    // 注入新的事件监听
    @Async
    @EventListener
    public void handlePrivateMessageEvent(PrivateMessageEvent event) {
        String sender = event.getSenderUid();
        String receiver = event.getReceiverUid();
        String content = event.getContent();

        // 1. 查找是否存在“来自该用户”且“未读”的私信通知
        Notification existingNotif = notificationRepository
            .findFirstByReceiverUidAndSenderUidAndTypeAndIsReadFalse(
                receiver,
                sender,
                NotificationType.PRIVATE_MESSAGE
            );

        if (existingNotif != null) {
            // --- 策略 A：聚合模式 (推荐) ---
            // 如果已经有一条未读通知，我们只更新它的内容和时间，不新增记录
            // 这样消息中心不会被同一个人刷屏
            existingNotif.setContent(content); // 更新为最新那句话
            existingNotif.setCreatedAt(LocalDateTime.now()); // 更新时间，让它浮动到列表顶部
            notificationRepository.save(existingNotif);
            log.info("更新私信通知: {} -> {}", sender, receiver);
        } else {
            // --- 策略 B：新增模式 ---
            // 之前没有未读消息，新建一条
            Notification n = new Notification();
            n.setReceiverUid(receiver);
            n.setSenderUid(sender);
            n.setType(NotificationType.PRIVATE_MESSAGE);
            n.setContent(content); // 私信内容

            // 私信不关联 PostId 和 CommentId，设为 null
            n.setPostId(null);
            n.setCommentId(null);

            notificationRepository.save(n);
            log.info("新增私信通知: {} -> {}", sender, receiver);
        }
    }

    // 通用保存方法
    private void saveNotification(String receiver, String sender, NotificationType type, Long postId, Long commentId, String content) {
        Notification n = new Notification();
        n.setReceiverUid(receiver);
        n.setSenderUid(sender);
        n.setType(type);
        n.setPostId(postId);
        n.setCommentId(commentId);
        n.setContent(content); // 这里可以截取前50个字避免太长
        notificationRepository.save(n);
        log.info("生成通知: {} -> {} type={}", sender, receiver, type);
    }
}