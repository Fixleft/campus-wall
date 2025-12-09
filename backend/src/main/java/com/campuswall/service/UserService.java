package com.campuswall.service;

import com.campuswall.dto.*;
import com.campuswall.entity.FriendRequest;
import com.campuswall.entity.User;
import com.campuswall.enums.FriendRequestStatus;
import com.campuswall.enums.UserRole;
import com.campuswall.repository.FriendRequestRepository;
import com.campuswall.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FriendService friendService;
    private final FriendRequestRepository friendRequestRepository;
    //禁言用户
    @Transactional
    public void muteUser(String uid, int days) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (days <= 0) {
            // 解禁
            user.setMuteEndTime(null);
        } else {
            // 禁言指定天数
            user.setMuteEndTime(LocalDateTime.now().plusDays(days));
        }

        userRepository.save(user);
    }

    // 辅助方法：检查用户是否被禁言 (供其他Service调用)
    public boolean isMuted(User user) {
        return user.getMuteEndTime() != null && user.getMuteEndTime().isAfter(LocalDateTime.now());
    }

   @Transactional
    public void resetPassword(String uid, String password) {
        log.info("管理员正在重置用户 {} 的密码", uid); // 记录日志

        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在"));

        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);
    }

    @Transactional
    public void setPassword(String uid, String originalPassword, String newPassword) {
        User user = userRepository.findById(uid)
                .orElseThrow(()->new UsernameNotFoundException("用户不存在"));

        if (!passwordEncoder.matches(originalPassword, user.getPassword())) {
            throw new IllegalArgumentException("旧密码错误，修改失败");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
             throw new IllegalArgumentException("新密码不能与旧密码相同");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void banUser(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setEnabled(false);
        userRepository.save(user);
    }

    // 如果需要解封
    public void unbanUser(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setEnabled(true);
        userRepository.save(user);
    }
    //搜索用户
    public Page<User> searchUsers(String keyword, Boolean enabled, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // 处理空字符串，确保 Repository 里的 :keyword IS NULL 生效
        if (keyword != null && keyword.trim().isEmpty()) {
            keyword = null;
        }

        return userRepository.searchUsers(keyword, enabled, pageable);
    }


     /**
     * 根据关键字搜索用户 (UID 或 Name)
     */
    public List<UserSearchDto> searchUsers(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Collections.emptyList();
        }

        // 1. 查库
        List<User> users = userRepository.searchUsers(keyword.trim());

        users.sort((u1, u2) -> {
            boolean u1Exact = u1.getUid().equals(keyword) || u1.getName().equals(keyword);
            boolean u2Exact = u2.getUid().equals(keyword) || u2.getName().equals(keyword);
            // u1Exact 为 true 时返回 -1 (排前面)，否则返回 1
            return Boolean.compare(u2Exact, u1Exact);
        });
        String currentUid = SecurityContextHolder.getContext().getAuthentication().getName();

        // 3. 批量查询好友状态 (防止 N+1)
        Set<String> myFriendUids = new HashSet<>();
        if (currentUid != null && !"anonymousUser".equals(currentUid)) {
            List<String> resultUids = users.stream().map(User::getUid).collect(Collectors.toList());
            // 调用 FriendService 获取其中哪些是好友
            myFriendUids = friendService.getFriendUidsFromList(currentUid, resultUids);
        }
        Set<String> finalFriendUids = myFriendUids;
        return users.stream()
                .map(user -> new UserSearchDto(
                        user.getUid(),
                        user.getName(),
                        user.getAvatar(),
                        user.getSignature(),
                        finalFriendUids.contains(user.getUid())
                ))
                .collect(Collectors.toList());
    }

    //用户注册
    @Value("${deepseek.bot-uid}")
    private String botUid;

    // 用户注册
    @Transactional // 确保注册和加好友在同一个事务里，要么都成功，要么都失败
    public User register(UserRegisterDto dto) {
        if (userRepository.existsByName(dto.getName())) {
            throw new RuntimeException("用户名已存在");
        }


        User user = new User();
        user.setUid(generateUniqueUid());
        user.setName(dto.getName());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(UserRole.USER);
        User savedUser = userRepository.save(user);


        if (botUid != null && !savedUser.getUid().equals(botUid)) {
            addAiFriendship(savedUser.getUid(), botUid);
        }

        return savedUser;
    }

    /**
     * 辅助方法：直接写入好友关系
     */
    private void addAiFriendship(String userUid, String botUid) {
        FriendRequest friendship = new FriendRequest();

        friendship.setRequesterUid(botUid);
        friendship.setAddresseeUid(userUid);

        friendship.setStatus(FriendRequestStatus.ACCEPTED);

        friendRequestRepository.save(friendship);
    }

    //用户登录
    public User login(UserLoginDto dto) {
        User user = userRepository.findByName(dto.getName())
                .orElseThrow(() -> new RuntimeException("用户名不存在"));
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        if (!user.getEnabled()) {
            throw new DisabledException("该账号已被封禁或注销，请联系管理员");
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

    // 获取当前用户的信息
    public UserInfoDto getCurrentUserInfo(String currentUid) {
        Optional<User> optionalUser = userRepository.findById(currentUid);
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
        dto.setEnable(user.getEnabled());
        return dto;
    }

    //获取其他用户信息
    public UserInfoDto getOtherUserInfo(String currentUid, String targetUid) {
        Optional<User> optionalUser = userRepository.findById(targetUid);
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
        dto.setFriend(friendRequestRepository.areFriends(currentUid, targetUid));
        dto.setEnable(user.getEnabled());
        return dto;
    }



    public Optional<User> findByName(String name) {
        return userRepository.findByName(name);
    }
}
