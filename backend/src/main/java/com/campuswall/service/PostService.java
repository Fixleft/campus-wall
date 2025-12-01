package com.campuswall.service;

import com.campuswall.dto.PostMediaDto;
import com.campuswall.dto.PostResponseDto;
import com.campuswall.dto.PostUpdateDto;
import com.campuswall.entity.*;
import com.campuswall.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostMediaRepository postMediaRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final UserLikesPostRepository likesRepository;
    private final MinioService minioService;
    private final TagService tagService;
    //编辑帖子
    @Transactional
    public void updatePost(Long postId, PostUpdateDto postUpdateDto, String currentUid) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
        if (!post.getUid().equals(currentUid)) {
            throw new AccessDeniedException("无权限编辑他人帖子");
        }
        post.setContent(postUpdateDto.getContent());
        post.setUpdatedAt(LocalDateTime.now());
        if (postUpdateDto.getTags() != null) {
            List<Tag> newTagsList = tagService.findOrCreateTags(postUpdateDto.getTags());


        if (post.getTags() == null) {
         post.setTags(new HashSet<>(newTagsList));
        } else {
                post.getTags().clear();
                post.getTags().addAll(newTagsList);
            }
        }
        postRepository.save(post);
    }
    //删除帖子
    @Transactional
    public void deletePost(Long postId, String currentUid) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
        if (!post.getUid().equals(currentUid)) {
            throw new AccessDeniedException("无权限删除他人的帖子");
        }
        //删除帖子下所以点赞
        likesRepository.deleteById_PostId(postId);
        //后续删除帖子所有评论
        postRepository.delete(post);
    }

    //获取帖子列表
    public Page<PostResponseDto> getLatestPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.findAllByOrderByCreatedAtDesc(pageable);

        return posts.map(this::convertToDTO);
    }


    public PostResponseDto convertToDTO(Post post) {
    PostResponseDto dto = new PostResponseDto();

    dto.setId(post.getId());
    dto.setContent(post.getContent());
    dto.setLocation(post.getLocation());
    dto.setAnonymous(post.getIsAnonymous());
    dto.setLikeCount(post.getLikeCount());
    dto.setCommentCount(post.getCommentCount());
    dto.setViewCount(post.getViewCount());
    dto.setCreatedAt(post.getCreatedAt());


    String currentUid = "anonymousUser"; // 默认值，防止未登录空指针
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
        currentUid = auth.getName();
    }

    boolean isOwner = post.getUid() != null && post.getUid().equals(currentUid);
    dto.setOwner(isOwner);

    // 1. 作者信息
    if (post.getIsAnonymous()) {
        dto.setAuthorName("匿名发布");
        dto.setAuthorAvatar("http://127.0.0.1:9000/campus-wall/default-avatar.png");
        dto.setAuthorUid(null);

    } else if (post.getUser() != null) {
        // 实名状态：正常返回
        dto.setAuthorName(post.getUser().getName());
        dto.setAuthorAvatar(post.getUser().getAvatar());
        dto.setAuthorUid(post.getUid());
    }

    // 2. Media 列表
    dto.setMediaUrls(
    post.getMediaList()
        .stream()
        .map(media -> new PostMediaDto(media.getUrl(), media.getType(), media.getCoverUrl()))
        .collect(Collectors.toList())
    );
    if (post.getTags() != null) {
        dto.setTags(
            post.getTags().stream()
                .map(Tag::getName) // 这里调用 Tag 实体的 getName 方法
                .collect(Collectors.toList())
        );
    } else {
        dto.setTags(new ArrayList<>());
    }

    String currentUserId = SecurityContextHolder.getContext()
            .getAuthentication()
            .getName();   // 就是 uid！
    boolean isLiked = likesRepository.existsById(
    new UserLikesPostId(currentUserId, post.getId())
    );
    dto.setIsLiked(isLiked);

    return dto;
}

    //上传帖子
    @Transactional(rollbackFor = Exception.class)
    public Post createPost(String uid,
                           String content,
                           String location,
                           boolean isAnonymous,
                           List<String> mediaUrls,
                           List<String> tagNames) throws Exception {

        // 1. 查找用户
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + uid));

        // 2. 创建 Post 实体
        Post post = new Post();
        post.setUid(uid);
        post.setContent(StringUtils.hasText(content) ? content.trim() : "");
        post.setLocation(StringUtils.hasText(location) ? location.trim() : "未知");
        post.setIsAnonymous(isAnonymous);
        post.setUser(user);

        // 3. 处理标签（自动复用或创建）
        if (tagNames != null && !tagNames.isEmpty()) {
            List<Tag> tags = tagNames.stream()
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .distinct()
                    .map(name -> tagRepository.findByName(name)
                            .orElseGet(() -> {
                                Tag newTag = new Tag();
                                newTag.setName(name);
                                return tagRepository.save(newTag);
                            }))
                    .toList();
            Set<Tag> SetTags = new HashSet<>(tags);
            post.setTags(SetTags);
        }

        // 4. 先保存 Post（生成 ID）
        Post savedPost = postRepository.save(post);

        // 5. 处理文件上传（图片 + 视频自动生成封面）
        if (mediaUrls != null && !mediaUrls.isEmpty()) {
            for (String url : mediaUrls) {
                if (!StringUtils.hasText(url)) continue;

                PostMedia media = new PostMedia();
                media.setPost(savedPost);
                media.setUrl(url);

                if (isVideoFile(url)) {
                    // --- 视频处理逻辑 ---
                    media.setType("video");
                    File tempCover = null;
                    try {
                        // 1. 调用 FFmpeg 生成本地临时封面
                        tempCover = generateVideoCover(url);

                        // 2. 上传到 Minio
                        String coverUrl = minioService.uploadFile(tempCover);

                        // 3. 设置封面 URL
                        media.setCoverUrl(coverUrl);
                    } catch (Exception e) {
                        e.printStackTrace();
                        // 封面生成失败不应阻断发帖，设为 null 即可
                        // 前端 PostCard 组件已处理 null 封面的情况（显示黑底视频）
                        media.setCoverUrl(null);
                    } finally {
                        // 4. 清理临时文件
                        if (tempCover != null && tempCover.exists()) {
                            tempCover.delete();
                        }
                    }
                } else {
                    // --- 图片处理逻辑 ---
                    media.setType("image");
                    media.setCoverUrl(null);
                }

                postMediaRepository.save(media);

                // 确保 entity 中的 list 也更新，以便返回给前端完整数据
                if (savedPost.getMediaList() == null) {
                    savedPost.setMediaList(new ArrayList<>());
                }
                savedPost.getMediaList().add(media);
            }
        }

        return savedPost;
    }

    // ================= 辅助方法 =================

    /**
     * 判断是否为视频 URL
     */
    private boolean isVideoFile(String url) {
        // 简单后缀判断，可根据需求扩展
        return url != null && url.matches("(?i).*\\.(mp4|mov|avi|wmv|flv|webm|mkv)$");
    }

    /**
     * 调用系统 FFmpeg 命令生成视频封面
     */
    private File generateVideoCover(String videoUrl) throws Exception {
        String tempDir = System.getProperty("java.io.tmpdir");
        // 生成临时文件名，例如: cover_uuid.jpg
        String outputFileName = "cover_" + UUID.randomUUID().toString() + ".jpg";
        File outputFile = new File(tempDir, outputFileName);

        List<String> command = new ArrayList<>();
        command.add("ffmpeg");       // 确保系统安装了 ffmpeg
        command.add("-i");           // 输入
        command.add(videoUrl);       // 视频地址（Minio http地址 或 本地路径均可）
        command.add("-ss");          // 时间偏移
        command.add("00:00:01");     // 截取第1秒（避免开头黑屏）
        command.add("-vframes");     // 帧数
        command.add("1");            // 只取1帧
        command.add("-y");           // 覆盖同名文件
        command.add(outputFile.getAbsolutePath()); // 输出路径

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        // 继承IO可以将ffmpeg日志输出到控制台，方便调试
        // processBuilder.inheritIO();

        Process process = processBuilder.start();
        int exitCode = process.waitFor(); // 等待执行结束

        if (exitCode != 0 || !outputFile.exists() || outputFile.length() == 0) {
            throw new RuntimeException("FFmpeg 生成封面失败，exitCode=" + exitCode);
        }

        return outputFile;
    }

   @Transactional
    public PostResponseDto toggleLike(String userId, Long postId) {
    // 校验帖子是否存在
    Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("帖子不存在"));

    // 构造 UserLikesPostId 实例
    UserLikesPostId likeId = new UserLikesPostId(userId, postId);

    if (likesRepository.existsById(likeId)) {
        // 取消点赞
        likesRepository.deleteById(likeId);
        postRepository.decrementLikeCount(postId);   // SQL -1
    } else {
        // 点赞
        likesRepository.save(new UserLikesPost(userId, postId));
        postRepository.incrementLikeCount(postId);   // SQL +1
    }

    // 返回更新后的帖子数据
    return convertToDTO(post);
}


    // 查询是否已点赞
    public boolean isLiked(String userId, Long postId) {
        return likesRepository.existsById(new UserLikesPostId(userId, postId));
    }

    // 获取帖子总点赞数（推荐用这个，比 post.likeCount 更实时）
    public long getLikeCount(Long postId) {
        return likesRepository.countById_PostId(postId);
    }
}
