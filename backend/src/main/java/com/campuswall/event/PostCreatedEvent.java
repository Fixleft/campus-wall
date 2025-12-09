package com.campuswall.event;

import com.campuswall.entity.Post;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class PostCreatedEvent extends ApplicationEvent {
    private final Post post;

    public PostCreatedEvent(Object source, Post post) {
        super(source);
        this.post = post;
    }
}