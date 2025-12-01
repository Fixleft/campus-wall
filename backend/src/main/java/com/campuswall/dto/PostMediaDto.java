package com.campuswall.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostMediaDto {

    private String url;
    private String type;
    private String coverUrl;
}
