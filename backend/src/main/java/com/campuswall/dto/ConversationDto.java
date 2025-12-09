package com.campuswall.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ConversationDto {
    private String targetUid;    // 聊天对象UID
    private String targetName;   // 聊天对象名字
    private String targetAvatar; // 聊天对象头像

    private String lastMessage;  // 最后一条消息内容
    private LocalDateTime lastTime; // 最后一条消息时间
    private int unreadCount;     // 未读消息数
}