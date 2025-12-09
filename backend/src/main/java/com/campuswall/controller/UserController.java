package com.campuswall.controller;

import com.campuswall.common.Result;
import com.campuswall.dto.*;
import com.campuswall.entity.FeedBack;
import com.campuswall.entity.User;
import com.campuswall.service.FeedBackService;
import com.campuswall.service.PostService;
import com.campuswall.service.UserService;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PostService postService;
    private final FeedBackService feedBackService;


     @PostMapping("/feedback")
    public ResponseEntity<String> submitFeedBack(@RequestBody FeedBackSubmitDto dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUid = authentication.getName();
        feedBackService.submitFeedBack(dto, currentUid);
        return ResponseEntity.ok("反馈已提交");
    }

    @PostMapping("/password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordDto dto) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUid = authentication.getName();


        userService.setPassword(currentUid, dto.getOriginalPassword(), dto.getNewPassword());

        return ResponseEntity.ok("密码修改成功，请重新登录");
    }

    @GetMapping("/search")
    @PermitAll // 允许未登录用户搜索
    public Result<List<UserSearchDto>> searchUsers(@RequestParam String keyword) {
        List<UserSearchDto> result = userService.searchUsers(keyword);
        return Result.ok(result);
    }

    @PutMapping("/{uid}/update")
    @RolesAllowed({"USER", "ADMIN"})
    public User updateProfile(@PathVariable String uid, @Valid @RequestBody UserProfileDto dto) {
        return userService.updateUserProfile(uid, dto);
    }



    @GetMapping("/info")
    @RolesAllowed({"USER", "ADMIN"})
    public ResponseEntity<UserInfoDto> getCurrentUserInfo(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
    String uid = authentication.getName();  // 从 token 里拿 uid
    return ResponseEntity.ok(userService.getCurrentUserInfo(uid));
    }

    @GetMapping("/info/{targetUid}")
    @PermitAll
    public ResponseEntity<UserInfoDto> getOtherUserInfo(@PathVariable String targetUid, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String currentUid = authentication.getName();
        return ResponseEntity.ok(userService.getOtherUserInfo(currentUid,targetUid));
    }

    @GetMapping("/posts")
    @RolesAllowed({"USER", "ADMIN"})
    public Map<String, Object> getUserPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        String uid = authentication.getName();
        Page<PostResponseDto> userPostPage = postService.getUserPosts(page, size, uid);

        Map<String, Object> response = new HashMap<>();
        response.put("content", userPostPage.getContent());
        response.put("currentPage", userPostPage.getNumber());
        response.put("totalItems", userPostPage.getTotalElements());
        response.put("totalPages", userPostPage.getTotalPages());

        return response;
    }

    @GetMapping("/posts/{uid}")
    @PermitAll
    public Map<String, Object> getUserPosts(
            @PathVariable String uid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Page<PostResponseDto> userPostPage = postService.getUserPosts(page, size, uid);

        Map<String, Object> response = new HashMap<>();
        response.put("content", userPostPage.getContent());
        response.put("currentPage", userPostPage.getNumber());
        response.put("totalItems", userPostPage.getTotalElements());
        response.put("totalPages", userPostPage.getTotalPages());

        return response;
    }

    @GetMapping("/posts/liked")
    @RolesAllowed({"USER", "ADMIN"})
    public Map<String, Object> getUserPostsLiked(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        String uid = authentication.getName();
        Page<PostResponseDto> userPostPage = postService.getUserPostsLiked(page, size, uid);

        Map<String, Object> response = new HashMap<>();
        response.put("content", userPostPage.getContent());
        response.put("currentPage", userPostPage.getNumber());
        response.put("totalItems", userPostPage.getTotalElements());
        response.put("totalPages", userPostPage.getTotalPages());

        return response;
    }
}
