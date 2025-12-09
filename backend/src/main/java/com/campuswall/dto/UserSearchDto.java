package com.campuswall.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSearchDto {
    private String uid;
    private String name;
    private String avatar;
    private String signature;
    private boolean isFriend;
   
}