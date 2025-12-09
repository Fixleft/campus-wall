package com.campuswall.listener;

import com.campuswall.entity.Comment;
import com.campuswall.entity.Post;
import com.campuswall.event.CommentCreatedEvent;
import com.campuswall.repository.CommentRepository;
import com.campuswall.repository.PostRepository;
import com.campuswall.service.DeepSeekService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiReplyListener {

    private final DeepSeekService deepSeekService;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    @Value("${deepseek.bot-uid}")
    private String aiUid;

    @Async // 关键：必须异步执行
    @EventListener
    public void handleCommentCreated(CommentCreatedEvent event) {
        Comment sourceComment = event.getComment();

        // 1. debug日志：看看事件有没有进来
        log.info("收到新评论事件: ID={}, UID={}", sourceComment.getId(), sourceComment.getUid());

        // 2. 防止死循环：如果这评论是 AI 自己发的，直接结束
        if (sourceComment.getUid().equals(aiUid)) {
            log.info("这是 AI 自己发的评论，忽略");
            return;
        }

        try {
            // 3. 获取帖子信息
            Post post = postRepository.findById(sourceComment.getPostId()).orElse(null);
            if (post == null) {
                log.error("找不到对应的帖子: {}", sourceComment.getPostId());
                return;
            }

            // ============ 核心逻辑修改开始 ============

            // 条件 A: 帖子是 AI 发的
            boolean isAiPost = post.getUid().equals(aiUid);

            // 条件 B: 这是一条回复，且回复的对象是 AI
            boolean isReplyingToAi = false;
            String parentContent = null;

            if (sourceComment.getParentId() != null) {
                Comment parent = commentRepository.findById(sourceComment.getParentId()).orElse(null);
                if (parent != null) {
                    // 只要父评论的作者是 AI，就算回复 AI
                    if (parent.getUid().equals(aiUid)) {
                        isReplyingToAi = true;
                    }
                    parentContent = parent.getContent();
                }
            }

            log.info("判定结果: IsAiPost={}, IsReplyingToAi={}", isAiPost, isReplyingToAi);

            // 只有满足 (在AI帖子下) 或者 (回复AI) 时，才触发
            if (isAiPost || isReplyingToAi) {

                log.info("满足触发条件，正在请求 DeepSeek...");

                // 调用 AI 生成回复
                String aiContent = deepSeekService.generateReply(
                        post.getContent(),
                        sourceComment.getContent(),
                        parentContent
                );

                if (aiContent != null && !aiContent.isBlank()) {
                    saveAiComment(post.getId(), sourceComment, aiContent);
                } else {
                    log.error("DeepSeek 返回内容为空");
                }
            } else {
                log.info("不满足 AI 回复条件 (不是AI的作品，也没人@AI)");
            }
            // ============ 核心逻辑修改结束 ============

        } catch (Exception e) {
            log.error("AI 监听处理发生异常", e);
        }
    }

   private void saveAiComment(Long postId, Comment targetComment, String content) {
        Comment aiComment = new Comment();
        aiComment.setPostId(postId);
        aiComment.setUid(aiUid);
        aiComment.setContent(content);
        aiComment.setCreatedAt(LocalDateTime.now());

        // 1. 设置被回复的人的 UID (前端显示回复 @某某 用)
        aiComment.setReplyToUid(targetComment.getUid());

        // 2. 设置直接父级 ParentId
        // 既然是回复，父级永远是刚才那条评论的 ID
        aiComment.setParentId(targetComment.getId());



        // 3. 设置所属楼层 RootParentId
        // 你的实体类定义：parentId == 0 表示这是一级评论
        if (targetComment.getParentId() == null || targetComment.getParentId() == 0L) {

            // --- 情况 A：用户刚才发的是一级评论（楼主）---
            // 用户评论：ID=100, Parent=0
            // AI 回复：应该属于 ID=100 这个楼层
            aiComment.setRootParentId(targetComment.getId());

        } else {

            // --- 情况 B：用户刚才发的是楼中楼（层主下的回复）---
            // 用户评论：ID=101, Parent=100, Root=100
            // AI 回复：应该继续保持在 ID=100 这个楼层
            aiComment.setRootParentId(targetComment.getRootParentId());
        }

        // ====================================

        commentRepository.save(aiComment);

        Long rootIdToUpdate = aiComment.getRootParentId();

        // 必须判空，防止异常
        if (rootIdToUpdate != null && rootIdToUpdate != 0L) {
             commentRepository.incrementReplyCount(rootIdToUpdate);
        } else {
             // 如果 AI 回复的是层主本身，rootParentId 也是它自己，或者逻辑上我们需要更新 targetComment
             commentRepository.incrementReplyCount(targetComment.getId());
        }

        log.info("AI 回复入库: User={}, NewCommentId={}, Parent={}, Root={}",
                 targetComment.getUid(), aiComment.getId(), aiComment.getParentId(), aiComment.getRootParentId());
    }
};