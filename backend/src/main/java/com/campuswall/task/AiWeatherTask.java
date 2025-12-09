package com.campuswall.task;

import com.campuswall.service.DeepSeekService;
import com.campuswall.service.PostService;
import com.campuswall.service.WeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class AiWeatherTask {

    private final WeatherService weatherService;
    private final DeepSeekService deepSeekService;
    private final PostService postService;

    @Value("${deepseek.bot-uid}")
    private String botUid;

    @Value("${weather.city-name}")
    private String cityName;

    /**
     * 每天早上 7:00 执行
     */
    @Scheduled(cron = "0 0 6 * * ?")
    public void broadcastWeather() {
        log.info("开始生成 AI 晨间天气预报...");

        // 1. 获取天气数据
        String weatherData = weatherService.getTodayWeather();
        if (weatherData == null) {
            log.warn("天气数据获取失败，跳过本次广播");
            return;
        }

        // 2. 构造 Prompt
        // 让 AI 扮演一个关心同学的角色
        String prompt = String.format(
            "今天是%s。所在地：%s。今日天气数据：%s。\n" +
            "请你写一篇【阿强的校园晨报】，字数100字左右。\n" +
            "要求：\n" +
            "1. 语气活泼、可爱、像个贴心的学长/学姐。\n" +
            "2. 必须包含天气情况。\n" +
            "3. 根据气温给出穿衣建议（比如冷了提醒穿秋裤，热了提醒防晒）。\n" +
            "4. 给出一条关于学习或生活的幽默小建议。\n" +
            "5. 结尾加一句正能量的早安语。",
            java.time.LocalDate.now(), cityName, weatherData
        );

        try {
            // 3. 调用 AI 生成文案
            // 这里复用你之前写的 chat 或 getSummary 方法，这里假设用 chat (支持 String 入参的那个)
            // 如果你的 chat 只支持 List<Map>，请自行组装一下
            String content = deepSeekService.getSummary(prompt); // 或者 deepSeekService.chat(prompt)

            if (content != null) {
                // 4. 发布帖子
                // 标签设为：早安、天气、AI日常
                postService.createPost(
                    botUid,
                    content,
                    cityName, // 发帖定位
                    false,
                    null,     // 没有图片
                    List.of("早安", "天气", "AI日常", "阿强")
                );
                log.info("AI 天气预报发布成功");
            }
        } catch (Exception e) {
            log.error("AI 天气预报生成失败", e);
        }
    }
}