package com.campuswall.controller;

import com.campuswall.dto.FeedBackListDto;
import com.campuswall.entity.FeedBack;
import com.campuswall.service.FeedBackService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/feedback")
@RequiredArgsConstructor
public class AdminFeedBackController {

    private final FeedBackService feedBackService;

    @GetMapping("/list")
    public ResponseEntity<Page<FeedBackListDto>> listAllFeedBack(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        return ResponseEntity.ok(feedBackService.getAllFeedBack(page, size));
    }


}
