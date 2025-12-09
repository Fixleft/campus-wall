package com.campuswall.service;

import com.campuswall.dto.*;
import com.campuswall.entity.*;
import com.campuswall.enums.NotificationType;
import com.campuswall.event.LikeEvent;
import com.campuswall.event.PostCreatedEvent;
import com.campuswall.repository.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
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
    private final UserService userService;
    private final UserLikesPostRepository likesRepository;
    private final MinioService minioService;
    private final TagService tagService;
    private final ApplicationEventPublisher eventPublisher;
    private final FriendRequestRepository friendRequestRepository;
    // ================= 查询相关 (已优化 N+1) =================
    //管理员物理删除方法
    @Transactional
    public void deletePostPhysically(Long postId) {
        if (!postRepository.existsById(postId)) {
             throw new RuntimeException("帖子不存在");
        }
        likesRepository.deleteById_PostId(postId);
        postRepository.deleteById(postId);
    }

    //屏蔽帖子
    public void blockPost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(()->new RuntimeException("帖子不存在"));

        post.setStatus(1);
        postRepository.save(post);
    }

    //解除屏蔽帖子
    public void unBlockPost(long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(()->new RuntimeException("帖子不存在"));

        post.setStatus(0);
        postRepository.save(post);
    }

    //获取管理员帖子列表
    public Page<PostResponseDto> searchAdminPosts(String keyword, Integer status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // 处理空字符串
        if (keyword != null && keyword.trim().isEmpty()) {
            keyword = null;
        }
        Page<Post> postPage = postRepository.searchPostsForAdmin(keyword, status, pageable);
        return postPage.map(post -> convertToDTO(post, null, false, false));
    }

    /**
     * 获取某用户(targetUid)点赞过的帖子列表
     * @param page 页码
     * @param size 每页数量
     * @param targetUid 目标用户的UID（查看谁的点赞列表）
     */
    public Page<PostResponseDto> getUserPostsLiked(int page, int size, String targetUid) {
        Pageable pageable = PageRequest.of(page, size);

        // 1. 查库
        Page<Post> posts = postRepository.findLikedPostsByUid(targetUid, pageable);

        // 2. 转换 (使用 mapToPageDto 自动处理 N+1 和当前登录用户的点赞状态)
        // 注意：这里传入 getCurrentUidOptional() 是为了判断"当前查看者"是否点赞了这些帖子
        return mapToPageDto(posts, getCurrentUidOptional());
    }

    /**
     * 获取某用户(targetUid)发布的作品列表
     */
    public Page<PostResponseDto> getUserPosts(int page, int size, String targetUid) {
        Pageable pageable = PageRequest.of(page, size);
        //游客查询
        String currentUid = null;
        try {
            currentUid = SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {

        }
        // 1. 查库
        Page<Post> posts;
        if (targetUid.equals(currentUid)) {
            posts = postRepository.findByUidOrderByCreatedAtDesc(targetUid, pageable);
        } else {
            posts = postRepository.findActivePostsByUid(targetUid, pageable);
        }
        // 2. 转换
        return mapToPageDto(posts, getCurrentUidOptional());
    }

     public long getLikeCount(Long postId) {
        return likesRepository.countById_PostId(postId);
    }

    public boolean isLiked(String userId, Long postId) {
        if (userId == null || postId == null) {
            return false;
        }
        return likesRepository.existsById(new UserLikesPostId(userId, postId));
    }

    /**
     * 搜索帖子
     */
    public Page<PostResponseDto> searchPosts(String keyword, String currentUid, Pageable pageable) {
        if (!StringUtils.hasText(keyword)) {
            return Page.empty();
        }
        Page<Post> postPage = postRepository.searchByKeyword(keyword, pageable);
        return mapToPageDto(postPage, currentUid);
    }

    /**
     * 获取最新帖子列表
     */
    public Page<PostResponseDto> getLatestPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findAllActivePosts(pageable);
        return mapToPageDto(postPage, getCurrentUidOptional());
    }

    /**
     * ★★★ 核心优化方法：批量处理点赞状态，防止 N+1 ★★★
     */
    private Page<PostResponseDto> mapToPageDto(Page<Post> postPage, String currentUid) {
        if (postPage.isEmpty()) {
            return Page.empty();
        }

        List<Post> posts = postPage.getContent();

        // 1. 提取 ID 列表
        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());

        // 提取所有作者 UID (过滤掉匿名贴和自己)
        List<String> authorUids = posts.stream()
                .filter(p -> !p.getIsAnonymous() && p.getUid() != null && !p.getUid().equals(currentUid))
                .map(Post::getUid)
                .distinct()
                .collect(Collectors.toList());

        // 2. 批量查询数据
        Set<Long> likedPostIds = new HashSet<>();
        Set<String> myFriendUids = new HashSet<>(); // 存放好友UID

        if (StringUtils.hasText(currentUid) && !"anonymousUser".equals(currentUid)) {
            // 查点赞
            likedPostIds = likesRepository.findLikedPostIdsByUidAndPostIds(currentUid, postIds);

            // ★★★ 查好友 (批量) ★★★
            if (!authorUids.isEmpty()) {
                myFriendUids = friendRequestRepository.findFriendUids(currentUid, authorUids);
            }
        }

        // 3. 转换 DTO
        Set<Long> finalLikedPostIds = likedPostIds;
        Set<String> finalFriendUids = myFriendUids;

        return postPage.map(post -> {
            boolean isLiked = finalLikedPostIds.contains(post.getId());
            // 判断是否好友：必须是非匿名，且在好友集合中
            boolean isFriend = !post.getIsAnonymous() && finalFriendUids.contains(post.getUid());

            return convertToDTO(post, currentUid, isLiked, isFriend); // 传入 isFriend
        });
    }



    // ================= 写入相关 =================

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

    @Transactional
    public void deletePost(Long postId, String currentUid) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("帖子不存在"));
        if (!post.getUid().equals(currentUid)) {
            throw new AccessDeniedException("无权限删除他人的帖子");
        }
        likesRepository.deleteById_PostId(postId);
        postRepository.delete(post);
    }

    /**
     * 点赞/取消点赞
     * 优化：手动更新内存对象，确保返回数据一致性
     */
    @Transactional
    public PostResponseDto toggleLike(String userId, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("帖子不存在"));

        UserLikesPostId likeId = new UserLikesPostId(userId, postId);
        boolean isLikedNow;

        if (likesRepository.existsById(likeId)) {
            // 取消点赞
            likesRepository.deleteById(likeId);
            postRepository.decrementLikeCount(postId);
            // 手动更新内存，防止返回旧数据
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            isLikedNow = false;
        } else {
            // 点赞
            likesRepository.save(new UserLikesPost(userId, postId));
            postRepository.incrementLikeCount(postId);
            // 手动更新内存
            post.setLikeCount(post.getLikeCount() + 1);
            isLikedNow = true;
             eventPublisher.publishEvent(new LikeEvent(
                this,
                userId,         // 发起人
                post.getUid(),  // 接收人 (帖子作者)
                postId,         // 帖子ID
                null,           // 评论ID (这里是赞帖子，所以为 null)
                NotificationType.LIKE_POST // 类型
            ));
        }

        return convertToDTO(post, userId, isLikedNow, false);
    }

    @Transactional(rollbackFor = Exception.class)
    public Post createPost(String uid,
                           String content,
                           String location,
                           boolean isAnonymous,
                           List<MediaItemRequest> mediaItems,
                           List<String> tagNames) throws Exception {

        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + uid));
        if (userService.isMuted(user)) {

            throw new RuntimeException("您已被禁言，解封时间：" + user.getMuteEndTime());
        }

        Post post = new Post();
        post.setUid(uid);
        post.setContent(StringUtils.hasText(content) ? content.trim() : "");
        post.setLocation(StringUtils.hasText(location) ? location.trim() : "未知");
        post.setIsAnonymous(isAnonymous);
        post.setUser(user);

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
            post.setTags(new HashSet<>(tags));
        }

        Post savedPost = postRepository.save(post);

        if (mediaItems != null && !mediaItems.isEmpty()) {
            List<PostMedia> mediaList = new ArrayList<>();

            for (MediaItemRequest item : mediaItems) {
                if (!StringUtils.hasText(item.getUrl())) continue;

                PostMedia media = new PostMedia();
                media.setPost(savedPost);
                media.setUrl(item.getUrl());
                media.setWidth(item.getWidth() != null ? item.getWidth() : 0);
                media.setHeight(item.getHeight() != null ? item.getHeight() : 0);

                if (isVideoFile(item.getUrl()) || "video".equals(item.getType())) {
                    media.setType("video");
                    File tempCover = null;
                    try {
                        tempCover = generateVideoCover(item.getUrl());
                        MediaItemRequest coverResult = minioService.uploadLocalFile(tempCover);
                        media.setCoverUrl(coverResult.getUrl());

                        // 视频宽高修正
                        if (media.getWidth() == 0 || media.getHeight() == 0) {
                            media.setWidth(coverResult.getWidth());
                            media.setHeight(coverResult.getHeight());
                        }
                    } catch (Exception e) {
                        e.printStackTrace(); // 记录日志，但不阻断发帖
                        media.setCoverUrl(null);
                    } finally {
                        if (tempCover != null && tempCover.exists()) tempCover.delete();
                    }
                } else {
                    media.setType("image");
                    media.setCoverUrl(null);
                }

                postMediaRepository.save(media);
                mediaList.add(media);
            }
            savedPost.setMediaList(mediaList);
        }
        eventPublisher.publishEvent(new PostCreatedEvent(this, savedPost));
        return savedPost;
    }

    // ================= 辅助/内部方法 =================

    /**
     * 统一的 DTO 转换方法
     */
    private PostResponseDto convertToDTO(Post post, String currentUid, boolean isLiked, boolean isFriend) {
        PostResponseDto dto = new PostResponseDto();

        dto.setId(post.getId());
        dto.setContent(post.getContent());
        dto.setLocation(post.getLocation());
        dto.setAnonymous(post.getIsAnonymous());
        dto.setLikeCount(post.getLikeCount());
        dto.setCommentCount(post.getCommentCount());
        dto.setViewCount(post.getViewCount());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setStatus(post.getStatus());
        boolean isOwner = post.getUid() != null && post.getUid().equals(currentUid);
        dto.setOwner(isOwner);

        if (post.getIsAnonymous()) {
            dto.setAuthorName("匿名发布");
            // 建议将此 URL 配置在 application.yml 中
            dto.setAuthorAvatar("http://127.0.0.1:9000/campus-wall/default-avatar.png");
            dto.setAuthorUid(null);
        } else if (post.getUser() != null) {
            dto.setAuthorName(post.getUser().getName());
            dto.setAuthorAvatar(post.getUser().getAvatar());
            dto.setAuthorUid(post.getUid());
        }

        // 避免 LazyLoading 异常，这里最好确保 Entity 里的 List 已经被初始化
        // 如果使用了 EntityGraph 就不需要担心，否则这里可能会触发 N+1 SQL
        if (post.getMediaList() != null) {
            dto.setMedia(post.getMediaList().stream()
                    .map(media -> new PostMediaDto(media.getUrl(), media.getType(), media.getCoverUrl(), media.getWidth(), media.getHeight()))
                    .collect(Collectors.toList()));
        } else {
            dto.setMedia(Collections.emptyList());
        }

        if (post.getTags() != null) {
            dto.setTags(post.getTags().stream().map(Tag::getName).collect(Collectors.toList()));
        } else {
            dto.setTags(Collections.emptyList());
        }

        dto.setIsLiked(isLiked);
        dto.setFriend(isFriend);
        return dto;
    }

    private String getCurrentUidOptional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null; // 或者返回 "anonymousUser"
    }

    private boolean isVideoFile(String url) {
        return url != null && url.matches("(?i).*\\.(mp4|mov|avi|wmv|flv|webm|mkv)$");
    }

    private File generateVideoCover(String videoUrl) throws Exception {
        String tempDir = System.getProperty("java.io.tmpdir");
        String outputFileName = "cover_" + UUID.randomUUID().toString() + ".jpg";
        File outputFile = new File(tempDir, outputFileName);

        List<String> command = new ArrayList<>();
        command.add("ffmpeg");
        command.add("-i");
        command.add(videoUrl);
        command.add("-ss");
        command.add("00:00:01");
        command.add("-vframes");
        command.add("1");
        command.add("-y");
        command.add(outputFile.getAbsolutePath());

        ProcessBuilder processBuilder = new ProcessBuilder(command);

        // ★★★ 关键修复：合并错误流并丢弃输出，防止 FFmpeg 缓冲区填满导致死锁 ★★★
        processBuilder.redirectErrorStream(true);
        processBuilder.redirectOutput(ProcessBuilder.Redirect.DISCARD);

        Process process = processBuilder.start();
        int exitCode = process.waitFor();

        if (exitCode != 0 || !outputFile.exists() || outputFile.length() == 0) {
            throw new RuntimeException("FFmpeg 生成封面失败，exitCode=" + exitCode);
        }

        return outputFile;
    }
}