package com.campuswall.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.util.UUID;

@Service
public class MinioService {

    @Autowired
    private MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.url}")
    private String minioHost; // 比如 http://127.0.0.1:9000

    /**
     * 原有方法：处理前端上传的 MultipartFile
     */
    public String uploadFile(MultipartFile file) throws Exception {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(bucketName)
                        .object(fileName)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build()
        );

        return String.format("%s/%s/%s", minioHost, bucketName, fileName);
    }

    /**
     * 【新增方法】：处理后端生成的本地 File (用于视频封面上传)
     */
    public String uploadFile(File file) throws Exception {
        // 生成唯一文件名
        String fileName = UUID.randomUUID() + "_" + file.getName();

        // 使用 try-with-resources 自动关闭流
        try (FileInputStream fis = new FileInputStream(file)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(fis, file.length(), -1)
                            .contentType("image/jpeg") // 封面通常是 JPG
                            .build()
            );
        }

        // 返回永久 URL
        return String.format("%s/%s/%s", minioHost, bucketName, fileName);
    }
}