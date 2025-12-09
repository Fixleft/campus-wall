package com.campuswall.controller;


import com.campuswall.dto.UserProfileDto;
import com.campuswall.dto.UserRegisterDto;
import com.campuswall.entity.User;
import com.campuswall.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/user")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserService userService;
    //禁言或解禁用户
    @PostMapping("/{uid}/mute")
    public ResponseEntity<String> muteUser(
            @PathVariable String uid,
            @RequestParam int days
    ) {
        userService.muteUser(uid, days);
        if (days > 0) {
            return ResponseEntity.ok("用户已被禁言 " + days + " 天");
        } else {
            return ResponseEntity.ok("用户已解除禁言");
        }
    }
    //获取用户列表
    @GetMapping("/list")
     public ResponseEntity<Page<User>> getUserList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Boolean enabled = null;
        if (status != null) {
            if (status == 1) enabled = true;
            else if (status == 2) enabled = false;
        }
        Page<User> userPage = userService.searchUsers(keyword, enabled, page, size);

        return ResponseEntity.ok(userPage);
    }
    //添加用户
    @PostMapping("/add")
    public ResponseEntity addUser(@Valid @RequestBody UserRegisterDto dto){
         User user = userService.register(dto);
          return ResponseEntity.ok("用户创建成功");
    }
    //封禁用户
    @PostMapping("/{uid}/ban")
    public ResponseEntity<String> banUser(@PathVariable String uid){
        userService.banUser(uid);
        return ResponseEntity.ok("用户已封禁");
    }
    //解封用户
    @PostMapping("/{uid}/unban")
    public ResponseEntity<String> unbanUser(@PathVariable String uid){
        userService.unbanUser(uid);
        return ResponseEntity.ok("用户已解封");
    }
    //重置密码
    @PostMapping("/{uid}/reset-password")
    public ResponseEntity resetPassword(@PathVariable String uid) {
        userService.resetPassword(uid, "123456"); // 记得加密！
        return ResponseEntity.ok("密码已重置为 123456");
    }
    //编辑用户信息
    @PostMapping("/{uid}/edit")
    public User editUser(@PathVariable String uid, @RequestBody UserProfileDto dto) {
        return userService.updateUserProfile(uid, dto);
    }

}
