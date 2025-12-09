package com.campuswall.service;

import com.campuswall.dto.CommentRequest;
import com.campuswall.dto.MediaItemRequest;
import com.campuswall.entity.*;
import com.campuswall.enums.NotificationType;
import com.campuswall.event.CommentCreatedEvent;
import com.campuswall.event.LikeEvent;
import com.campuswall.repository.*;
import com.campuswall.vo.CommentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Lombok自动生成构造函数注入
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UserService userService;

    /**
     * 管理员强制删除评论
     * 不需要校验 uid，直接删
     */
    @Override
    @Transactional
    public void deleteCommentByAdmin(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("评论不存在"));

        Long postId = comment.getPostId();

        // 1. 物理删除评论
        commentRepository.delete(comment);

        // 2. 减少帖子的评论计数 (复用 PostRepository 的方法)
        postRepository.decrementCommentCount(postId);
    }

    @Override
     public Page<Comment> searchAdminComments(Long postId, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        if (keyword != null && keyword.trim().isEmpty()) keyword = null;

        return commentRepository.searchCommentsForAdmin(postId, keyword, pageable);
    }
    @Override
    @Transactional(rollbackFor = Exception.class)
    public CommentVO publishComment(String uid, CommentRequest request) {
        // 1. 查找用户
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + uid));

        if (userService.isMuted(user)) {

            throw new RuntimeException("您已被禁言，解封时间：" + user.getMuteEndTime());
        }

        // 2. 查找帖子
        boolean postExists = postRepository.existsById(request.getPostId());
        if (!postExists) {
            throw new IllegalArgumentException("帖子不存在");
        }
        // 3. 创建 Comment 实体
        Comment comment = new Comment();
        comment.setPostId(request.getPostId());
        comment.setUid(uid);
        comment.setUser(user);
        comment.setContent(StringUtils.hasText(request.getContent()) ? request.getContent().trim() : "");
        comment.setReplyToUid(request.getReplyToUid());
        // 4. 处理层级结构
        Long parentId = (request.getParentId() == null) ? 0L : request.getParentId();
        comment.setParentId(parentId);

        if (parentId == 0) {
            comment.setRootParentId(0L);
        } else {
            Comment parent = commentRepository.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("回复的父评论不存在"));
            Long rootId = (parent.getRootParentId() == 0) ? parent.getId() : parent.getRootParentId();
            comment.setRootParentId(rootId);
        }

        // 5. 处理媒体文件
        List<MediaItemRequest> mediaItems = request.getImages();
        if (mediaItems != null && !mediaItems.isEmpty()) {

            for (MediaItemRequest item : mediaItems) {
                if (!StringUtils.hasText(item.getUrl())) continue;

                CommentMedia media = new CommentMedia();
                media.setUrl(item.getUrl());
                media.setComment(comment);
                media.setType(item.getType());
                media.setWidth(item.getWidth() != null ? item.getWidth() : 0);
                media.setHeight(item.getHeight() != null ? item.getHeight() : 0);
                comment.addMedia(media);
            }
        }

        // 6. 保存评论
        // JPA save 后，comment 对象会被回填 id 和 createdAt (由 @PrePersist 生成)
        comment = commentRepository.save(comment);
        eventPublisher.publishEvent(new CommentCreatedEvent(this, comment));
        // 7. 更新计数器
        postRepository.incrementCommentCount(request.getPostId());
        if (comment.getRootParentId() != 0) {
            commentRepository.incrementReplyCount(comment.getRootParentId());
        }

        // 8. ★★★ 转换为 VO 并返回 ★★★
        // 参数说明: (comment实体, 发布者user, isLiked=false)
        // 刚发布的评论，当前用户肯定还没点赞，所以 isLiked 传 false
        return CommentVO.fromEntity(comment, user, false);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteComment(Long commentId, String currentUid) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("评论不存在"));

        // 1. 获取帖子信息（为了拿到楼主UID）
        Post post = postRepository.findById(comment.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("关联帖子不存在"));

        // 2. 权限校验逻辑
        // 允许删除的条件：
        // A. 我是这条评论的发布者
        // B. 我是这条帖子的楼主 (Post Owner)
        boolean isCommentOwner = comment.getUid().equals(currentUid);
        boolean isPostOwner = post.getUid().equals(currentUid);

        if (!isCommentOwner && !isPostOwner) {
            throw new IllegalArgumentException("无权删除该评论");
        }

        // 3. 执行删除...
        comment.setIsDeleted(true);
        comment.setContent("该评论已删除");
        if (comment.getMediaList() != null) {
            comment.getMediaList().clear();
        }
        commentRepository.save(comment);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void likeComment(Long commentId, String uid) {
        // 1. 检查是否已赞
        if (commentLikeRepository.existsByCommentIdAndUid(commentId, uid)) {
            throw new RuntimeException("无需重复点赞");
        }

        // 2. 插入点赞记录
        CommentLike like = new CommentLike(commentId, uid);
        commentLikeRepository.save(like);

        // 3. 评论点赞数 +1
        commentRepository.incrementLikeCount(commentId);
         Comment comment = commentRepository.findById(commentId).orElse(null);

        if (comment != null) {
            eventPublisher.publishEvent(new LikeEvent(
                    this,
                    uid,                // 发起人 (点赞者)
                    comment.getUid(),   // 接收人 (评论作者)
                    comment.getPostId(),// 关联帖子ID
                    commentId,          // 关联评论ID
                    NotificationType.LIKE_COMMENT // 类型
            ));
        }
    }

     @Override
    @Transactional(rollbackFor = Exception.class)
    public void unlikeComment(Long commentId, String uid) {
        // 1. 删除点赞记录
        if (commentLikeRepository.existsByCommentIdAndUid(commentId, uid)) {
            commentLikeRepository.deleteByCommentIdAndUid(commentId, uid);

            // 2. 原子减少计数
            commentRepository.decrementLikeCount(commentId);
        }
    }

    @Override
    public Page<CommentVO> getPostFloors(Long postId, String currentUid, Pageable pageable) {
        // 1. 查询一级评论分页数据
        Page<Comment> floorPage = commentRepository.findFloorsByPostId(postId, pageable);

        // 2. ★★★ 批量查询用户信息 ★★★
        // 提取当前页中所有评论的 replyToUid (被回复人的ID)
        Map<String, User> replyToUserMap = batchFetchUsers(floorPage.getContent());

        // 3. 转换为 VO，传入 map
        return floorPage.map(comment -> convertToVO(comment, currentUid, replyToUserMap));
    }

    @Override
    public List<CommentVO> getFloorReplies(Long rootId, String currentUid) {
        // 1. 查库：查楼中楼
        List<Comment> replies = commentRepository.findByRootParentIdOrderByCreatedAtAsc(rootId);

        // 2. ★★★ 批量查询用户信息 ★★★
        Map<String, User> replyToUserMap = batchFetchUsers(replies);

        // 3. 转换 VO
        return replies.stream()
                .map(comment -> convertToVO(comment, currentUid, replyToUserMap))
                .collect(Collectors.toList());
    }
     private Map<String, User> batchFetchUsers(List<Comment> comments) {
        if (comments == null || comments.isEmpty()) {
            return Collections.emptyMap();
        }

        // 1. 收集所有不为空的 replyToUid，使用 Set 去重
        Set<String> uids = comments.stream()
                .map(Comment::getReplyToUid)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());

        if (uids.isEmpty()) {
            return Collections.emptyMap();
        }

        // 2. 一次性查询所有用户 (需要在 UserRepository 中支持 findAllById)
        List<User> users = userRepository.findAllById(uids);

        // 3. 转换 List 为 Map<String, User> 方便 O(1) 获取
        return users.stream()
                .collect(Collectors.toMap(User::getUid, Function.identity()));
    }
    private CommentVO convertToVO(Comment comment, String currentUid, Map<String, User> replyToUserMap) {
        // 1. 判断是否点赞 (如果这里也有性能问题，也可以类似地批量查点赞状态，目前先优化 User 查询)
        boolean isLiked = StringUtils.hasText(currentUid) &&
                          commentLikeRepository.existsByCommentIdAndUid(comment.getId(), currentUid);

        CommentVO vo = CommentVO.fromEntity(comment, comment.getUser(), isLiked);

        // 2. 设置回复对象的昵称
        String replyToUid = comment.getReplyToUid();
        if (StringUtils.hasText(replyToUid)) {
            // 直接从 Map 获取，内存操作，无需 SQL
            User targetUser = replyToUserMap.get(replyToUid);

            if (targetUser != null) {
                vo.setReplyToNickname(targetUser.getName());
            } else {
                // 有 replyToUid 但查不到 User，说明用户可能注销了
                vo.setReplyToNickname("未知用户");
            }
        }

        return vo;
    }
}