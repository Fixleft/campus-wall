package com.campuswall.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MediaItemRequest {
    private String url;
    private String type;   // "image" 或 "video"
    private Integer width;
    private Integer height;
}