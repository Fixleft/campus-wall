package com.campuswall.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DeepSeekService {

    @Value("${deepseek.api-key}")
    private String apiKey;

    @Value("${deepseek.base-url}")
    private String baseUrl;

    @Value("${deepseek.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getSummary(String content) {
        String url = baseUrl + "/chat/completions";

        // 1. 构建请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // 2. 构建 Prompt (提示词)
        // 这里的 prompt 决定了 AI 的语气，可以根据需要调整
        String systemPrompt = "你是东华大学松江校区校园墙社区的AI课代表。请模仿光头强用幽默、亲切、憨厚的语言（50字以内）总结用户的帖子内容。如果是提问，可以尝试给出简短建议。建议里不许出现模仿光头强的字眼";

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", content)
        ));
        body.put("temperature", 0.7);

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            // 发送请求
            String response = restTemplate.postForObject(url, request, String.class);

            // 解析 JSON (DeepSeek 返回格式与 OpenAI 一致)
            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").get(0).path("message").path("content").asText();

        } catch (Exception e) {
            e.printStackTrace();
            return null; // 失败返回空
        }
    }

     /**
     * AI 陪聊模式
     */
    public String chat(List<Map<String, String>> contextMessage) {
        String url = baseUrl + "/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);



        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", contextMessage);
        body.put("temperature", 1);

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(url, request, String.class);
            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            e.printStackTrace();
            return "我现在有点晕，稍后再聊吧~"; // 兜底回复
        }
    }

    /**
     * 生成评论回复
     * @param postContent 帖子原本的内容（让AI知道上下文）
     * @param targetUserContent 用户发的评论内容
     * @param parentContent 如果是回复评论，这里是父评论的内容；如果是回复帖子，这里传 null
     * @return AI 的回复内容
     */
    public String generateReply(String postContent, String targetUserContent, String parentContent) {
        String url = baseUrl + "/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // 构建上下文
        List<Map<String, String>> messages = new ArrayList<>();

        // 1. 系统人设
        messages.add(Map.of("role", "system", "content", "你是东华大学松江校区校园墙社区的AI课代表。请模仿光头强用幽默、亲切、憨厚、活泼、有点爱吃瓜，偶尔会用网络热梗的语言（50字以内）回复同学的评论。回复里不许出现模仿光头强的字眼"));

        // 2. 注入帖子背景信息
        String contextInfo = "当前帖子的内容是：" + postContent;
        if (parentContent != null) {
            contextInfo += "。用户正在回复的话是：" + parentContent;
        }
        messages.add(Map.of("role", "user", "content", contextInfo));
        messages.add(Map.of("role", "assistant", "content", "好的，我了解了上下文，请告诉我这位同学说了什么？"));

        // 3. 用户的评论
        messages.add(Map.of("role", "user", "content", targetUserContent));

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        body.put("temperature", 0.8); // 稍微高一点，让评论更有趣

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(url, request, String.class);
            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            e.printStackTrace();
            return "我现在有点晕，稍后再聊吧~";
        }
    }
}