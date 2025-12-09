package com.campuswall.service;

import com.campuswall.dto.NotificationDto;
import com.campuswall.entity.Notification;
import com.campuswall.entity.User;
import com.campuswall.repository.NotificationRepository;
import com.campuswall.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * 获取未读数量
     */
    public long getUnreadCount(String uid) {
        return notificationRepository.countByReceiverUidAndIsReadFalse(uid);
    }

    /**
     * 标记全部已读
     */
    @Transactional
    public void markAllAsRead(String uid) {
        notificationRepository.markAllAsRead(uid);
    }

    /**
     * 获取通知列表 (分页)
     */
    public List<NotificationDto> getMyNotifications(String uid, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByReceiverUidOrderByCreatedAtDesc(uid, pageable);
        List<Notification> notifications = page.getContent();

        if (notifications.isEmpty()) {
            return Collections.emptyList();
        }

        // 批量查询用户信息 (Sender)，避免 N+1 问题
        Set<String> senderUids = notifications.stream()
                .map(Notification::getSenderUid)
                .collect(Collectors.toSet());

        List<User> users = userRepository.findAllById(senderUids);
        Map<String, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getUid, u -> u));

        // 转换为 DTO
        return notifications.stream().map(n -> {
            NotificationDto dto = new NotificationDto();
            dto.setId(n.getId());
            dto.setSenderUid(n.getSenderUid());
            dto.setType(n.getType());
            dto.setContent(n.getContent());
            dto.setPostId(n.getPostId());
            dto.setIsRead(n.getIsRead());
            dto.setCreatedAt(n.getCreatedAt());

            User sender = userMap.get(n.getSenderUid());
            if (sender != null) {
                dto.setSenderName(sender.getName());
                dto.setSenderAvatar(sender.getAvatar());
            } else {
                dto.setSenderName("未知用户");
                dto.setSenderAvatar(""); // 默认头像由前端处理
            }
            return dto;
        }).collect(Collectors.toList());
    }
}