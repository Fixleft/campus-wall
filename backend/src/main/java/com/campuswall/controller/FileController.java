package com.campuswall.controller;

import com.campuswall.service.MinioService;
import jakarta.annotation.security.PermitAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private MinioService minioService;

    @PostMapping("/upload")
    @PermitAll
    public String upload(@RequestParam("file") MultipartFile file) throws Exception {
        return minioService.uploadFile(file);
    }
}
