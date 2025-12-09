package com.campuswall.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardStatsDto {
    // 总数
    private long totalUsers;
    private long totalPosts;
    private long totalComments;

    // 今日新增 (这里可以定义为 long，也可以定义为 int)
    private long todayNewUsers;
    private long todayNewPosts;
    private long todayNewComments;

    // (可选) 过去7天活跃用户数等，根据需要扩展
}