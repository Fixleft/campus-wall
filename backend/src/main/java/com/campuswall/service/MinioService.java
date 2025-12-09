package com.campuswall.service;

import com.campuswall.dto.MediaItemRequest;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.UUID;

@Service
public class MinioService {

    @Autowired
    private MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.url}")
    private String minioHost;

    /**
     * 【优化后】：处理前端上传，同时返回宽高
     */
   public MediaItemRequest uploadFile(MultipartFile file) throws Exception {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String contentType = file.getContentType();
        int width = 0;
        int height = 0;
        String type = "unknown";

        // 1. 【关键修改】先将文件一次性读入内存，避免流冲突
        // Windows 内存充裕，传图片这样写最稳，绝对不会出 Stream Closed 错误
        byte[] fileBytes = file.getBytes();

        // 2. 计算宽高 (从字节数组读取)
        if (contentType != null && contentType.startsWith("image")) {
            type = "image";
            try (InputStream is = new ByteArrayInputStream(fileBytes)) {
                BufferedImage image = ImageIO.read(is);
                if (image != null) {
                    width = image.getWidth();
                    height = image.getHeight();
                }
            } catch (Exception e) {
                // 计算失败仅打印，不阻断流程
                System.err.println("计算图片尺寸失败: " + e.getMessage());
            }
        } else if (contentType != null && contentType.startsWith("video")) {
            type = "video";
        }

        // 3. 上传到 MinIO (从字节数组读取)
        try (InputStream uploadStream = new ByteArrayInputStream(fileBytes)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(uploadStream, fileBytes.length, -1) // 使用字节长度
                            .contentType(contentType)
                            .build()
            );
        }

        String url = String.format("%s/%s/%s", minioHost, bucketName, fileName);

        // 打印日志，确保代码走到了这里
        System.out.println("上传成功: URL=" + url + ", W=" + width + ", H=" + height);

        return new MediaItemRequest(url,type, width, height);
    }

    /**
     * 处理本地文件 (主要用于视频封面)
     */
    public MediaItemRequest uploadLocalFile(File file) throws Exception {
        String fileName = UUID.randomUUID() + "_" + file.getName();
        int width = 0;
        int height = 0;

        // 1. 获取封面图宽高
        try {
            BufferedImage image = ImageIO.read(file);
            if (image != null) {
                width = image.getWidth();
                height = image.getHeight();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. 上传
        try (FileInputStream fis = new FileInputStream(file)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(fis, file.length(), -1)
                            .contentType("image/jpeg")
                            .build()
            );
        }

        String url = String.format("%s/%s/%s", minioHost, bucketName, fileName);
        return new MediaItemRequest(url,"image", width, height);
    }
}