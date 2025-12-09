package com.campuswall.service;

import com.campuswall.dto.ConversationDto;
import com.campuswall.entity.PrivateMessage;
import com.campuswall.entity.User;
import com.campuswall.enums.NotificationType;
import com.campuswall.event.MessageSentEvent;
import com.campuswall.event.PrivateMessageEvent;
import com.campuswall.repository.NotificationRepository;
import com.campuswall.repository.PrivateMessageRepository;
import com.campuswall.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final PrivateMessageRepository messageRepository;
    private final FriendService friendService;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final NotificationRepository notificationRepository;



    public long getTotalUnreadCount(String currentUid) {
        return messageRepository.countByReceiverUidAndIsReadFalse(currentUid);
    }
    /**
     * 标记会话已读
     * @param currentUid 当前用户ID (我，即接收者)
     * @param targetUid  聊天对象ID (对方，即发送者)
     */
    @Transactional(rollbackFor = Exception.class)
    public void markAsRead(String currentUid, String targetUid) {
        // 将 targetUid 发给 currentUid 的消息标记为已读
        messageRepository.markMessagesAsRead(currentUid, targetUid);
        notificationRepository.markPrivateMessageAsRead(currentUid, targetUid);
    }

    // 获取会话列表
    public List<ConversationDto> getConversationList(String currentUid) {
        // 1. 获取该用户参与的所有消息 (按时间倒序)
        List<PrivateMessage> allMessages = messageRepository.findAllByUid(currentUid);

        // 2. 使用 Map 去重，保留与每个用户交互的“最新一条”消息
        // Key: 对方的UID, Value: 消息对象
        Map<String, PrivateMessage> latestMsgMap = new LinkedHashMap<>(); // 保持顺序

        for (PrivateMessage msg : allMessages) {
            // 确定对方是谁
            String otherUid = msg.getSenderUid().equals(currentUid) ? msg.getReceiverUid() : msg.getSenderUid();

            // 因为查询是倒序的，如果 map 里没有，说明这条就是最新的
            if (!latestMsgMap.containsKey(otherUid)) {
                latestMsgMap.put(otherUid, msg);
            }
        }

        // 3. 构建 DTO 列表
        List<ConversationDto> conversations = new ArrayList<>();

        for (Map.Entry<String, PrivateMessage> entry : latestMsgMap.entrySet()) {
            String targetUid = entry.getKey();
            PrivateMessage latestMsg = entry.getValue();

            User targetUser = userRepository.findById(targetUid).orElse(null);
            if (targetUser == null) continue;

            ConversationDto dto = new ConversationDto();
            dto.setTargetUid(targetUser.getUid());
            dto.setTargetName(targetUser.getName());
            dto.setTargetAvatar(targetUser.getAvatar());
            dto.setLastMessage(latestMsg.getContent());
            dto.setLastTime(latestMsg.getCreatedAt());

            // 统计未读数 (别人发给我的未读消息)
            int unread = messageRepository.countUnread(currentUid, targetUid);
            dto.setUnreadCount(unread);

            conversations.add(dto);
        }

        return conversations;
    }


    // 发送私信
    @Transactional
    public PrivateMessage sendMessage(String senderUid, String receiverUid, String content) {
        // 1. 校验是否为好友
        if (!friendService.isFriend(senderUid, receiverUid)) {
            throw new RuntimeException("非好友关系，无法发送私信");
        }

        PrivateMessage message = new PrivateMessage(senderUid, receiverUid, content);
        PrivateMessage savedMessage = messageRepository.save(message);


        eventPublisher.publishEvent(new MessageSentEvent(this, savedMessage));
        eventPublisher.publishEvent(new PrivateMessageEvent(
            this,
            senderUid,
            receiverUid,
            content
        ));
        return savedMessage;
    }

    // 获取聊天记录
    public Page<PrivateMessage> getChatHistory(String currentUid, String otherUid, int page, int size) {
        return messageRepository.findChatHistory(currentUid, otherUid, PageRequest.of(page, size));
    }

     @Transactional(rollbackFor = Exception.class)
        public void clearChatHistory(String currentUid, String targetUid) {

            messageRepository.hideMessagesSentBy(currentUid, targetUid);

            messageRepository.hideMessagesReceivedFrom(currentUid, targetUid);

        }

}