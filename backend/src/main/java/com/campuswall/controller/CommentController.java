package com.campuswall.controller;

import com.campuswall.common.Result;
import com.campuswall.dto.CommentRequest;
import com.campuswall.vo.CommentVO;
import com.campuswall.service.CommentService;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * 发布评论
     * POST /api/comments/publish
     */
    @PostMapping("/publish")
    @RolesAllowed({"USER", "ADMIN"})
    public Result<CommentVO> publishComment(@RequestBody @Valid CommentRequest request) {
        // 1. 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String uid = authentication.getName();

        // 2. 调用服务
        CommentVO commentVO = commentService.publishComment(uid, request);

        // 3. 返回给前端
        return Result.ok(commentVO);
    }

    /**
     * 删除评论
     * DELETE /api/comments/{commentId}
     */
    @DeleteMapping("/{commentId}")
    @RolesAllowed({"USER", "ADMIN"})
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String uid = authentication.getName();

       commentService.deleteComment(commentId, uid);

        return ResponseEntity.noContent().build();
    }

    /**
     * 点赞评论
     * POST /api/comments/{commentId}/like
     */
    @PostMapping("/{commentId}/like")
    @RolesAllowed({"USER", "ADMIN"})
    public Result<?> likeComment(@PathVariable Long commentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String uid = authentication.getName();
        commentService.likeComment(commentId, uid);
        return Result.ok("点赞成功");
    }

    /**
     * 取消点赞评论
     * POST /api/comments/{commentId}/unlike
     */
    @PostMapping("/{commentId}/unlike")
    @RolesAllowed({"USER", "ADMIN"})
    public Result<?> unlikeComment(@PathVariable Long commentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String uid = authentication.getName();

        commentService.unlikeComment(commentId, uid);
        return Result.ok("取消点赞成功");
    }

    /**
     * 获取帖子的一级评论（楼层）
     * GET /api/comments/post/{postId}
     * 分页返回
     */
    @GetMapping("/post/{postId}")
    @PermitAll
    public Map<String, Object> getPostFloors(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // 尝试获取当前用户UID (用于判断是否点赞)
        String currentUid = getCurrentUidOptional();

        Page<CommentVO> commentPage = commentService.getPostFloors(postId, currentUid, PageRequest.of(page, size));

        // 构造与 PostController 风格一致的分页返回结构
        Map<String, Object> response = new HashMap<>();
        response.put("content", commentPage.getContent());
        response.put("currentPage", commentPage.getNumber());
        response.put("totalItems", commentPage.getTotalElements());
        response.put("totalPages", commentPage.getTotalPages());

        return response;
    }

    /**
     * 获取某楼层的所有子回复
     * GET /api/comments/{rootId}/replies
     * 列表返回 (通常子回复不会特别多，一次性返回即可，或者也做分页)
     */
    @GetMapping("/{rootId}/replies")
    @PermitAll
    public Result<List<CommentVO>> getFloorReplies(@PathVariable Long rootId) {
        // 尝试获取当前用户UID
        String currentUid = getCurrentUidOptional();

        List<CommentVO> replies = commentService.getFloorReplies(rootId, currentUid);
        return Result.ok(replies);
    }

    // --- 辅助方法 ---

    /**
     * 获取可选的 UID。
     * 如果用户未登录，Authentication 可能是 "anonymousUser" 或者 null，此时返回 null。
     */
    private String getCurrentUidOptional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return null;
    }
}