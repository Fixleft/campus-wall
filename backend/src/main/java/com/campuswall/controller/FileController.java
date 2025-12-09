package com.campuswall.controller;

import com.campuswall.dto.MediaItemRequest;
import com.campuswall.service.MinioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private MinioService minioService;

   @PostMapping("/upload")
public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
    try {
        MediaItemRequest result = minioService.uploadFile(file);
        return ResponseEntity.ok(result);
    } catch (Exception e) {
         e.printStackTrace();
        return ResponseEntity.status(500).body("服务端上传出错: " + e.getMessage());
    }
}
}
