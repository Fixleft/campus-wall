package com.campuswall.controller;

import com.campuswall.entity.Comment;
import com.campuswall.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/comment")
@RequiredArgsConstructor
public class AdminCommentController {

    private final CommentService commentService;

    @DeleteMapping("/{commentId}")
    public ResponseEntity<String> deleteCommentByAdmin(@PathVariable Long commentId) {
        commentService.deleteCommentByAdmin(commentId);

        return ResponseEntity.ok("评论已删除");
    }

    @GetMapping("/list")
    public ResponseEntity<Page<Comment>> list(
            @RequestParam(required = false) Long postId, // 可选：只看某个帖子的评论
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(commentService.searchAdminComments(postId, keyword, page, size));
    }
}
