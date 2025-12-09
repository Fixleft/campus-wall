package com.campuswall.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminTokenDto {
    private String token;     // JWT 字符串
    private String uid;       // 用户 UID (方便前端获取用户信息)
    private String name;      // 用户名 (方便前端显示 "欢迎, admin")
    private String role;      // 角色 (前端可能用来做权限判断)
    private String avatar;
}