package com.campuswall.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreatePostRequestDto {
    private String content;
    private String location;
    private Boolean isAnonymous = false;
    private List<MediaItemRequest> mediaItems;
    private List<String> tags;

}
