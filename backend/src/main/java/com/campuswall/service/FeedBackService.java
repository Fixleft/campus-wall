package com.campuswall.service;

import com.campuswall.dto.FeedBackListDto;
import com.campuswall.dto.FeedBackSubmitDto;
import com.campuswall.entity.FeedBack;
import com.campuswall.entity.User;
import com.campuswall.repository.FeedBackRepository;
import com.campuswall.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedBackService {

    private final FeedBackRepository feedBackRepository;
    private final UserRepository userRepository;
      public Page<FeedBackListDto> getAllFeedBack(int page, int size) {
        // 1. 获取原始的反馈分页数据
        Pageable pageable = PageRequest.of(page, size);
        Page<FeedBack> feedBackPage = feedBackRepository.findAll(pageable);

        // 如果该页没有数据，直接返回一个空的 DTO 分页对象
        if (!feedBackPage.hasContent()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        List<FeedBack> feedBackList = feedBackPage.getContent();

        // 2. 【性能优化】一次性获取本页所有反馈对应的用户UIDs
        Set<String> uids = feedBackList.stream()
                .map(FeedBack::getUid)
                .collect(Collectors.toSet());

        // 3. 【性能优化】一次性从数据库查出所有需要的用户信息，并存入 Map
        //    这样可以快速通过 uid 找到对应的 User 对象
        Map<String, User> userMap = userRepository.findAllById(uids).stream()
                .collect(Collectors.toMap(User::getUid, user -> user));

        // 4. 使用 Stream API 将 List<FeedBack> 转换为 List<FeedBackListDto>
        List<FeedBackListDto> dtoList = feedBackList.stream().map(feedBack -> {
            FeedBackListDto dto = new FeedBackListDto();
            dto.setTitle(feedBack.getTitle());
            dto.setContent(feedBack.getContent());
            dto.setUid(feedBack.getUid());
            dto.setCreateAt(feedBack.getCreateAt());

            // 从 Map 中获取用户信息，避免了 N+1 查询
            User user = userMap.get(feedBack.getUid());
            if (user != null) {
                dto.setAuthorName(user.getName());
                dto.setAuthorAvatar(user.getAvatar());
            } else {
                // 如果找不到用户（比如用户已注销），提供默认值
                dto.setAuthorName("未知用户");

            }
            return dto;
        }).collect(Collectors.toList());

        // 5. 重新组装成 Page 对象并返回
        // PageImpl 构造器需要：内容列表、分页请求、总条目数
        return new PageImpl<>(dtoList, pageable, feedBackPage.getTotalElements());
    }

    public void submitFeedBack(FeedBackSubmitDto dto, String uid) {
        FeedBack feedBack = new FeedBack();
        feedBack.setTitle(dto.getTitle());
        feedBack.setContent(dto.getContent());
        feedBack.setUid(uid);
        feedBack.setCreateAt(LocalDateTime.now());
        feedBackRepository.save(feedBack);
    }
}
