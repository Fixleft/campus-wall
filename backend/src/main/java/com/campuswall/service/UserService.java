package com.campuswall.service;

import com.campuswall.dto.UserInfoDto;
import com.campuswall.dto.UserLoginDto;
import com.campuswall.dto.UserProfileDto;
import com.campuswall.dto.UserRegisterDto;
import com.campuswall.entity.User;
import com.campuswall.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    //用户注册
    public User register(UserRegisterDto dto) {
        if (userRepository.existsByName(dto.getName())) {
            throw new RuntimeException("用户名已存在");
        }
        User user = new User();
        user.setUid(generateUniqueUid());
        user.setName(dto.getName());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        return userRepository.save(user);
    }

    //用户登录
    public User login(UserLoginDto dto) {
        User user = userRepository.findByNameAndUid(dto.getName(), dto.getUid())
                .orElseThrow(() -> new RuntimeException("用户名或 UID 不存在"));
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        return user;
    }

    //生成唯一uid
    private String generateUniqueUid() {
            Random random = new Random();
            String uid;
            do {
                uid = String.valueOf(100000 + random.nextInt(900000)); // 生成 6 位数字
            } while (userRepository.existsByUid(uid)); // 确保唯一
            return uid;
    }

    //编辑用户信息
    @Transactional
    public User updateUserProfile(String uid, UserProfileDto dto) {
        Optional<User> optionalUser = userRepository.findById(uid);
        if (optionalUser.isEmpty()) {
            throw new IllegalArgumentException("用户不存在");
        }

        User user = optionalUser.get();
        if (dto.getAvatar() != null) user.setAvatar(dto.getAvatar());
        if (dto.getName() != null) user.setName(dto.getName());
        if (dto.getSignature() != null) user.setSignature(dto.getSignature());
        if (dto.getHometown() != null) user.setHometown(dto.getHometown());
        if (dto.getAge() != null) user.setAge(dto.getAge());
        if (dto.getGender() != null) user.setGender(dto.getGender());

        return userRepository.save(user);
    }

    //获取用户信息
    public UserInfoDto getUserInfo(String uid) {
        Optional<User> optionalUser = userRepository.findById(uid);
        if (optionalUser.isEmpty()) {
            throw new IllegalArgumentException("用户不存在");
        }
        User user = optionalUser.get();

        UserInfoDto dto = new UserInfoDto();
        dto.setUid(user.getUid());
        dto.setName(user.getName());
        dto.setAvatar(user.getAvatar());
        dto.setSignature(user.getSignature());
        dto.setHometown(user.getHometown());
        dto.setAge(user.getAge());
        dto.setGender(user.getGender());

        return dto;
    }

    public Optional<User> findByName(String name) {
        return userRepository.findByName(name);
    }
}
