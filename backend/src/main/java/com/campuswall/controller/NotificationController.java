package com.campuswall.controller;

import com.campuswall.common.Result; // 假设你有统一返回类 Result
import com.campuswall.dto.NotificationDto;
import com.campuswall.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 获取未读数量 (系统通知)
    @GetMapping("/unread-count")
    public Result<Long> getUnreadCount(Authentication auth) {
        String currentUid = auth.getName();
        return Result.ok(notificationService.getUnreadCount(currentUid));
    }

    // 获取列表 (默认第一页，20条)
    @GetMapping
    public Result<List<NotificationDto>> getList(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String currentUid = auth.getName();
        Pageable pageable = PageRequest.of(page, size);
        return Result.ok(notificationService.getMyNotifications(currentUid, pageable));
    }

    // 全部已读
    @PostMapping("/read-all")
    public Result<Void> markAllAsRead(Authentication auth) {
        String currentUid = auth.getName();
        notificationService.markAllAsRead(currentUid);
        return Result.ok();
    }
}