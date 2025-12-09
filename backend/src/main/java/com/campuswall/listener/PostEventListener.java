package com.campuswall.listener;

import com.campuswall.dto.CommentRequest;
import com.campuswall.entity.Post;
import com.campuswall.event.PostCreatedEvent;
import com.campuswall.service.CommentService;
import com.campuswall.service.DeepSeekService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@Slf4j
@RequiredArgsConstructor
public class PostEventListener {

    private final DeepSeekService deepSeekService;
    private final CommentService commentService;

    @Value("${deepseek.bot-uid}")
    private String botUid;

    /**
     * 监听帖子创建事件
     * @Async 确保在一个新的线程中执行，不阻塞用户发帖接口
     */
    @Async
    @EventListener
    public void handlePostCreated(PostCreatedEvent event) {
        Post post = event.getPost();

        // 1. 简单校验：如果内容太短（比如只发了一张图没文字），可能不需要总结
        if (!StringUtils.hasText(post.getContent()) || post.getContent().length() < 3) {
            log.info("帖子内容过短，AI跳过总结: {}", post.getId());
            return;
        }

        try {
            // 2. 模拟一点延迟（可选），让AI评论看起来更自然，不像秒回的机器
            Thread.sleep(2000);

            log.info("AI正在生成帖子 {} 的总结...", post.getId());

            // 3. 调用 DeepSeek 获取总结
            String summary = deepSeekService.getSummary(post.getContent());

            if (StringUtils.hasText(summary)) {
                // 4. 构造评论请求
                CommentRequest commentRequest = new CommentRequest();
                commentRequest.setPostId(post.getId());
                // 给总结加个前缀，增加趣味性
                commentRequest.setContent(summary);

                // 5. 调用现有的 CommentService 发布评论
                commentService.publishComment(botUid, commentRequest);

                log.info("AI 总结评论发布成功: {}", post.getId());
            }

        } catch (Exception e) {
            log.error("AI 总结生成失败", e);
            // 异步线程中的异常不会影响主线程，记录日志即可
        }
    }
}