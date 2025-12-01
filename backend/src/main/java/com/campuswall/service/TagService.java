package com.campuswall.service;

import com.campuswall.entity.Tag;
import com.campuswall.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service // 1. 必须标记为 Spring Bean
@RequiredArgsConstructor // 2. 生成构造函数以注入 tagRepository
public class TagService {

      private final TagRepository tagRepository;

      @Transactional
    public List<Tag> findOrCreateTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return new ArrayList<>();
        }

        return tagNames.stream()
            .filter(name -> name != null && !name.trim().isEmpty())
            .map(String::trim)
            .distinct()
            .map(name -> {
                return tagRepository.findByName(name)
                        .orElseGet(() -> tagRepository.saveAndFlush(new Tag(name)));
            })
            .collect(Collectors.toList());
    }
}