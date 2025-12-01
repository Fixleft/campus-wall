package com.campuswall.dto;

import lombok.Data;

import java.util.List;

@Data
public class PostUpdateDto {

    private String content;

    private List<String> tags;
}
