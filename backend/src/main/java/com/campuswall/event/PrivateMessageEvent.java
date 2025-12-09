package com.campuswall.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class PrivateMessageEvent extends ApplicationEvent {
    private final String senderUid;
    private final String receiverUid;
    private final String content; // 私信的具体内容

    public PrivateMessageEvent(Object source, String senderUid, String receiverUid, String content) {
        super(source);
        this.senderUid = senderUid;
        this.receiverUid = receiverUid;
        this.content = content;
    }
}