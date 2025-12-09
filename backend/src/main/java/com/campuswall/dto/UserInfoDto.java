package com.campuswall.dto;

import com.campuswall.enums.UserRole;
import lombok.Data;

@Data
public class UserInfoDto {
    private String uid;
    private String name;
    private String avatar;
    private String signature;
    private String hometown;
    private Integer age;
    private String gender;
    private boolean isFriend;
    private String role;
    private boolean enable;
}
