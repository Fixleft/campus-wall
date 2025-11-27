package com.campuswall.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class UserRegisterDto {

    @NotBlank(message = "用户名不能为空")
    @Size(max = 100, message = "用户名长度不能超过100字符")
    private String name;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 30, message = "密码长度必须在6-30之间")
    private String password;
}
