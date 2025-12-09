package com.campuswall.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FriendRequestDto {
    private Long id;            // 请求ID
    private String uid;         // 申请人UID
    private String name;        // 申请人名字
    private String avatar;      // 申请人头像
    private LocalDateTime createdAt;
}