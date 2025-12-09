package com.campuswall.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "private_message")
@Data
@NoArgsConstructor
public class PrivateMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_uid", nullable = false)
    private String senderUid;

    @Column(name = "receiver_uid", nullable = false)
    private String receiverUid;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private Boolean isRead = false; // 是否已读

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "boolean default false")
    private boolean deletedBySender = false;

    @Column(columnDefinition = "boolean default false")
    private boolean deletedByReceiver = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public PrivateMessage(String senderUid, String receiverUid, String content) {
        this.senderUid = senderUid;
        this.receiverUid = receiverUid;
        this.content = content;
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
        this.deletedBySender = false;
        this.deletedByReceiver = false;
    }
}