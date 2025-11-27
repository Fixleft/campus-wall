package com.campuswall.controller;

import com.campuswall.dto.UserLoginDto;
import com.campuswall.entity.User;
import com.campuswall.service.UserService;
import com.campuswall.utils.JwtUtil;  // ← 你等下建的工具类
import jakarta.annotation.security.PermitAll;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;   // 加上这一行！自动注入

    @PostMapping("/login")
    @PermitAll
    public ResponseEntity<?> login(@RequestBody UserLoginDto dto) {
        User user = userService.login(dto);

        String token = jwtUtil.generateToken(user);  // 现在可以直接调用了！

        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", user
        ));
    }
}