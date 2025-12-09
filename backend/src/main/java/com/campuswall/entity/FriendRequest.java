package com.campuswall.entity;

import com.campuswall.enums.FriendRequestStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "friend_request", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"requester_uid", "addressee_uid"}) // 防止重复申请
})
@Data
@NoArgsConstructor
public class FriendRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_uid", nullable = false)
    private String requesterUid; // 发起人

    @Column(name = "addressee_uid", nullable = false)
    private String addresseeUid; // 接收人

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendRequestStatus status = FriendRequestStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public FriendRequest(String requesterUid, String addresseeUid) {
        this.requesterUid = requesterUid;
        this.addresseeUid = addresseeUid;
    }
}