package com.campuswall.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
@RequiredArgsConstructor
public class WeatherService {

    @Value("${weather.api-url}")
    private String apiUrl;

    @Value("${weather.api-key}")
    private String apiKey;

    @Value("${weather.city-id}")
    private String cityId;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 获取今日天气简介
     * 返回格式示例： "晴，气温 5-15度，微风"
     */
   public String getTodayWeather() {
    try {
        String url = String.format("%s?city=%s&key=%s&extensions=all", apiUrl, cityId, apiKey);
        String response = restTemplate.getForObject(url, String.class);

        JsonNode root = objectMapper.readTree(response);
        String status = root.path("status").asText();

        if ("1".equals(status)) {  // 高德API成功状态是"1"
            JsonNode forecast = root.path("forecasts").get(0);
            JsonNode casts = forecast.path("casts").get(0); // 获取今天的数据

            String dayWeather = casts.path("dayweather").asText();  // 白天天气
            String nightWeather = casts.path("nightweather").asText();  // 晚上天气
            String tempMax = casts.path("daytemp").asText();  // 最高温
            String tempMin = casts.path("nighttemp").asText();  // 最低温
            String windDirDay = casts.path("daywind").asText();  // 白天风向

            // 判断白天晚上天气是否相同
            String weatherDesc = dayWeather.equals(nightWeather)
                ? dayWeather
                : dayWeather + "转" + nightWeather;

            return String.format("%s，气温 %s℃ ~ %s℃，%s风",
                weatherDesc, tempMin, tempMax, windDirDay);
        } else {
            log.error("天气API返回失败: {}", root.path("info").asText());
        }
    } catch (Exception e) {
        log.error("获取天气失败", e);
    }

    // 兜底数据
    return "多云转晴，气温 12℃ ~ 22℃，微风";
}
}