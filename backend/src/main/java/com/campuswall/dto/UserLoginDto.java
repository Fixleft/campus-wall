package com.campuswall.dto;

import com.campuswall.enums.UserRole;
import lombok.Data;

@Data
public class UserLoginDto {
    private String name;
    private String password;
    private boolean enable;
    private UserRole userRole;
}
