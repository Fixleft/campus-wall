package com.campuswall.controller;

import com.campuswall.common.Result;
import com.campuswall.dto.ConversationDto;
import com.campuswall.dto.FriendDto;
import com.campuswall.dto.FriendRequestDto;
import com.campuswall.entity.FriendRequest;
import com.campuswall.entity.PrivateMessage;
import com.campuswall.repository.FriendRequestRepository;
import com.campuswall.repository.UserRepository;
import com.campuswall.service.FriendService;
import com.campuswall.service.MessageService;
import jakarta.annotation.security.RolesAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final FriendService friendService;
    private final MessageService messageService;

    @GetMapping("/message/unread-count")
    public Result<Long> getUnreadCount(Authentication auth) {
        if (auth == null) {
            return Result.ok(0L);
        }
        String currentUid = auth.getName();
        return Result.ok(messageService.getTotalUnreadCount(currentUid));
    }
    @PostMapping("/message/read")
    public Result<?> markAsRead(@RequestParam String targetUid) {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        messageService.markAsRead(currentUid, targetUid);
        return Result.ok("已标记为已读");
    }

    @GetMapping("/message/conversations")
    public Result<List<ConversationDto>> getConversations() {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        return Result.ok(messageService.getConversationList(currentUid));
    }
    // 获取好友列表
    @GetMapping("/friend/list")
    public Result<List<FriendDto>> getFriendList() {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        return Result.ok(friendService.getMyFriends(currentUid));
    }

    // 删除好友
    @DeleteMapping("/friend/{friendUid}")
    public Result<?> deleteFriend(@PathVariable String friendUid) {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        friendService.deleteFriend(currentUid, friendUid);
        return Result.ok("好友已删除");
    }

    // 1. 发送申请 POST /api/social/friend/request?targetUid=xxx
    @PostMapping("/friend/request")
    public Result<?> sendRequest(@RequestParam String targetUid) {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        friendService.sendFriendRequest(currentUid, targetUid);
        return Result.ok("申请已发送");
    }

    // 2. 同意申请 POST /api/social/friend/accept/{requestId}
    @PostMapping("/friend/accept/{requestId}")
    public Result<?> acceptRequest(@PathVariable Long requestId) {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        friendService.handleFriendRequest(requestId, currentUid, true);
        return Result.ok("已添加好友");
    }

    // 3. 拒绝申请
    @PostMapping("/friend/reject/{requestId}")
    public Result<?> rejectRequest(@PathVariable Long requestId) {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        friendService.handleFriendRequest(requestId, currentUid, false);
        return Result.ok("已拒绝");
    }

    // 4. 获取我收到的申请列表
     @GetMapping("/friend/requests")
    public Result<List<FriendRequestDto>> getMyRequests() {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        return Result.ok(friendService.getPendingRequestsDto(currentUid)); // 调用新方法
    }

    // --- 私信相关 ---

    // 5. 发送私信 POST /api/social/message
    @PostMapping("/message")
    @RolesAllowed({"USER", "ADMIN"})
    public Result<?> sendMessage(@RequestParam String toUid, @RequestParam String content) {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        messageService.sendMessage(currentUid, toUid, content);
        return Result.ok("发送成功");
    }

    // 6. 获取和某人的聊天记录 GET /api/social/message/history?otherUid=xxx
    @GetMapping("/message/history")
    @RolesAllowed({"USER", "ADMIN"})
    public Result<Page<PrivateMessage>> getHistory(
            @RequestParam String otherUid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        return Result.ok(messageService.getChatHistory(currentUid, otherUid, page, size));
    }

    @DeleteMapping("/conversations/{targetUid}")
    public ResponseEntity<String> clearHistory(@PathVariable String targetUid) {
         String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        messageService.clearChatHistory(currentUid, targetUid);
        return ResponseEntity.ok("聊天记录已清空");
    }
}