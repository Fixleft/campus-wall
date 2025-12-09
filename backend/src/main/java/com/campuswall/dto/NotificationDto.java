package com.campuswall.dto;

import com.campuswall.enums.NotificationType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDto {
    private Long id;
    private String senderUid;
    private String senderName;
    private String senderAvatar;
    private NotificationType type;
    private String content;
    private Long postId;
    private Boolean isRead;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}