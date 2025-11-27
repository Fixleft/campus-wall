package com.campuswall.controller;

import com.campuswall.dto.UserInfoDto;
import com.campuswall.dto.UserProfileDto;
import com.campuswall.dto.UserRegisterDto;
import com.campuswall.entity.User;
import com.campuswall.service.UserService;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    @PermitAll
    public User register(@Valid @RequestBody UserRegisterDto dto) {
        return userService.register(dto);
    }

    @PutMapping("/{uid}/update")
    @PermitAll
    public User updateProfile(@PathVariable String uid, @Valid @RequestBody UserProfileDto dto) {
        return userService.updateUserProfile(uid, dto);
    }

    @GetMapping("/{uid}/info")
    @PermitAll
    public UserInfoDto getUserInfo(@PathVariable String uid) {
        return userService.getUserInfo(uid);
    }

    @GetMapping("/info")
    public ResponseEntity<UserInfoDto> getCurrentUserInfo(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
    String uid = authentication.getName();  // 从 token 里拿 uid
    return ResponseEntity.ok(userService.getUserInfo(uid));
}
}
