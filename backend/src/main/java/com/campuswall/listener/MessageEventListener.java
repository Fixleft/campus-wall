package com.campuswall.listener;

import com.campuswall.entity.PrivateMessage;
import com.campuswall.event.MessageSentEvent;
import com.campuswall.repository.PrivateMessageRepository;
import com.campuswall.service.DeepSeekService;
import com.campuswall.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class MessageEventListener {

    private final DeepSeekService deepSeekService;
    private final MessageService messageService;
    private final PrivateMessageRepository messageRepository;
    @Value("${deepseek.bot-uid}")
    private String botUid;

   @Async
    @EventListener
    public void handleMessageSent(MessageSentEvent event) {
        PrivateMessage msg = event.getMessage();

        // 1. 判断是否发给 AI
        if (!msg.getReceiverUid().equals(botUid)) return;
        if (msg.getSenderUid().equals(botUid)) return;

        try {

            String userUid = msg.getSenderUid();
            List<PrivateMessage> history = messageRepository.findRecentMessages(
                userUid,
                botUid,
                PageRequest.of(0, 20) // 限制上下文长度，防止 token 溢出和费用过高
            );


            Collections.reverse(history);


            List<Map<String, String>> aiContext = new ArrayList<>();


            aiContext.add(Map.of(
                "role", "system",
                "content", "你是东华大学松江校区校园墙社区的AI课代表兼聊天助手,你叫阿强来自团结屯。请模仿光头强,用简短、轻松的语气回复同学的消息。不要长篇大论，像朋友一样聊天。如果不知道答案就诚实说。不要重复用户的每一句话。"
            ));


            for (PrivateMessage pm : history) {
                String role = pm.getSenderUid().equals(botUid) ? "assistant" : "user";
                String content = pm.getContent().length() > 500
                                 ? pm.getContent().substring(0, 500)
                                 : pm.getContent();

                aiContext.add(Map.of("role", role, "content", content));
            }


            String replyContent = deepSeekService.chat(aiContext);

            if (StringUtils.hasText(replyContent)) {
                messageService.sendMessage(botUid, userUid, replyContent);
                log.info("AI 上下文回复成功，长度: {}", aiContext.size());
            }

        } catch (Exception e) {
            log.error("AI 回复失败", e);
        }
    }
}