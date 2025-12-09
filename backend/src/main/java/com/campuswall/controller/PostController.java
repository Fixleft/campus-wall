package com.campuswall.controller;

import com.campuswall.dto.CreatePostRequestDto;
import com.campuswall.dto.PostResponseDto;
import com.campuswall.dto.PostUpdateDto;
import com.campuswall.entity.Post;
import com.campuswall.entity.User;
import com.campuswall.service.PostService;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.campuswall.common.Result;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;


     @GetMapping("/search")
    @PermitAll // 允许未登录用户搜索
    public Result<Page<PostResponseDto>> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        // 1. 获取当前用户UID (可能为 null 或 "anonymousUser")
        String currentUid = getCurrentUidOptional();

        // 2. 调用 Service
        Page<PostResponseDto> result = postService.searchPosts(keyword, currentUid, PageRequest.of(page, size));

        // 3. 返回结果
        return Result.ok(result);
    }

    // --- 辅助方法 ---
    private String getCurrentUidOptional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return null;
    }

   @GetMapping("/latest")
    @PermitAll
    // 1. 修改返回类型为 Result<Map<String, Object>>
    public Result<Map<String, Object>> getLatestPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {

        Page<PostResponseDto> postPage = postService.getLatestPosts(page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("content", postPage.getContent());
        response.put("currentPage", postPage.getNumber());
        response.put("totalItems", postPage.getTotalElements());
        response.put("totalPages", postPage.getTotalPages());

        // 2. 使用 Result.ok() 进行包装
        return Result.ok(response);
    }

    @PostMapping("/upload")
    @RolesAllowed({"USER", "ADMIN"})

    public Post uploadPost(@RequestBody @Valid CreatePostRequestDto request) throws Exception {
        // 1. 获取当前登录用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

    // 直接拿 uid，绝对不会为空（因为 @RolesAllowed 已经校验过了）
    String uid = authentication.getName();   // ← 改成这行！

    return postService.createPost(
        uid,
        request.getContent(),
        request.getLocation(),
        Boolean.TRUE.equals(request.getIsAnonymous()),
        request.getMediaItems(),
        request.getTags()
    );
}

    @PostMapping("/{postId}/like")
    @RolesAllowed({"USER", "ADMIN"})
    public Result<?> like(Authentication authentication,
                          @PathVariable Long postId) {
        String userId = authentication.getName();   // ← 直接拿 uid，100% 有值！
        postService.toggleLike(userId, postId);
        return Result.ok("操作成功");
    }

    @GetMapping("/{postId}/liked")
        public Result<Boolean> isLiked(@AuthenticationPrincipal String userId,
                                       @PathVariable Long postId) {
            return Result.ok(postService.isLiked(userId, postId));
    }

    @DeleteMapping("/{postId}")
    @RolesAllowed({"USER", "ADMIN"})
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        String currentUid = authentication.getName();

        postService.deletePost(postId, currentUid);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{postId}")
    @RolesAllowed({"USER", "ADMIN"})
    public ResponseEntity<Void> updatePost(
            @PathVariable Long postId,
            @RequestBody @Valid PostUpdateDto dto,
            Authentication authentication
    ) {
        String currentUid = authentication.getName();
        postService.updatePost(postId, dto, currentUid);
        return ResponseEntity.ok().build();
    }

}
