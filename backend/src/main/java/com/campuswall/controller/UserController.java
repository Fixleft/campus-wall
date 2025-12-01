package com.campuswall.controller;

import com.campuswall.dto.PostResponseDto;
import com.campuswall.dto.UserInfoDto;
import com.campuswall.dto.UserProfileDto;
import com.campuswall.entity.User;
import com.campuswall.service.PostService;
import com.campuswall.service.UserService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    @PutMapping("/{uid}/update")
    @RolesAllowed("USER")
    public User updateProfile(@PathVariable String uid, @Valid @RequestBody UserProfileDto dto) {
        return userService.updateUserProfile(uid, dto);
    }



    @GetMapping("/info")
    @RolesAllowed("USER")
    public ResponseEntity<UserInfoDto> getCurrentUserInfo(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
    String uid = authentication.getName();  // 从 token 里拿 uid
    return ResponseEntity.ok(userService.getUserInfo(uid));
    }

    @GetMapping("/posts")
    @RolesAllowed("USER")
    public Map<String, Object> getUserPosts(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        String uid = authentication.getName();
        Page<PostResponseDto> userPostPage = userService.getUserPosts(page, size, uid);

        Map<String, Object> response = new HashMap<>();
        response.put("content", userPostPage.getContent());
        response.put("currentPage", userPostPage.getNumber());
        response.put("totalItems", userPostPage.getTotalElements());
        response.put("totalPages", userPostPage.getTotalPages());

        return response;
    }
}
