package com.campuswall.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FriendDto {
    private String uid;
    private String name;
    private String avatar;
    private String signature;
}