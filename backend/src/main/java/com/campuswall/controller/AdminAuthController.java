package com.campuswall.controller;

import com.campuswall.dto.AdminTokenDto;
import com.campuswall.dto.UserLoginDto;
import com.campuswall.entity.User;
import com.campuswall.enums.UserRole;
import com.campuswall.repository.UserRepository; // 或者引入 UserService
import com.campuswall.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails; // 引入这个接口
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository; // 需要引入 Repository 来查询完整用户信息

    @PostMapping("/login")
    public ResponseEntity<?> adminLogin(@RequestBody UserLoginDto loginDto) {
        try {
            // 1. 认证
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginDto.getName(),
                    loginDto.getPassword()
                )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // 3. 从 userDetails 中拿到 UID (因为你在 UserDetailsService 里把 UID 塞进了 username 字段)
            String uid = userDetails.getUsername();

            // 4. 【关键】再去数据库查一次，拿到完整的自定义 User 实体
            User user = userRepository.findByUid(uid)
                    .orElseThrow(() -> new UsernameNotFoundException("用户数据异常"));

            // 5. 校验权限
            if (user.getRole() != UserRole.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("{\"code\":403, \"message\":\"禁止访问：非管理员账号\"}");
            }

            // 6. 生成 Token
            String token = jwtUtil.generateToken(user);

            // 7. 返回结果
            AdminTokenDto responseDto = AdminTokenDto.builder()
                    .token(token)
                    .uid(user.getUid())
                    .name(user.getName())
                    .role(user.getRole().name())
                    .avatar(user.getAvatar())
                    .build();

            return ResponseEntity.ok(responseDto);

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("{\"code\":401, \"message\":\"账号或密码错误\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"code\":500, \"message\":\"系统内部错误\"}");
        }
    }
}