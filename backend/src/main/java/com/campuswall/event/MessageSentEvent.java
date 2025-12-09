package com.campuswall.event;

import com.campuswall.entity.PrivateMessage;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class MessageSentEvent extends ApplicationEvent {
    private final PrivateMessage message;

    public MessageSentEvent(Object source, PrivateMessage message) {
        super(source);
        this.message = message;
    }
}