package com.campuswall.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserProfileDto {

    @Size(max = 255, message = "头像链接过长")
    private String avatar;

    @Size(max = 100, message = "name最长为100字")
    private String name;

    @Size(max = 255, message = "个性签名最大255字")
    private String signature;

    @Size(max = 100, message = "家乡长度过长")
    private String hometown;

    @Min(value = 0, message = "年龄不能为负数")
    @Max(value = 150, message = "年龄不合法")
    private Integer age;

    @Pattern(regexp = "男|女|保密", message = "性别必须为男 / 女 / 保密")
    private String gender;
}
