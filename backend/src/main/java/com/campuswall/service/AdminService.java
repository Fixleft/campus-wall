package com.campuswall.service;

import com.campuswall.dto.AdminDashboardStatsDto;
import com.campuswall.repository.CommentRepository;
import com.campuswall.repository.PostRepository;
import com.campuswall.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    /**
     * 获取管理后台仪表盘的统计数据
     */
    public AdminDashboardStatsDto getDashboardStats() {
        // 总数
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long totalComments = commentRepository.count();

        // 今日新增
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        // 假设你的实体类里有 createdAt 字段
        long todayNewUsers = userRepository.countByCreatedAtAfter(startOfToday);
        long todayNewPosts = postRepository.countByCreatedAtAfter(startOfToday);
        long todayNewComments = commentRepository.countByCreatedAtAfter(startOfToday);

        return AdminDashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .totalComments(totalComments)
                .todayNewUsers(todayNewUsers)
                .todayNewPosts(todayNewPosts)
                .todayNewComments(todayNewComments)
                .build();
    }
}