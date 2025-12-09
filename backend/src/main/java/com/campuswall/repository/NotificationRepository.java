package com.campuswall.repository;

import com.campuswall.entity.Notification;
import com.campuswall.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * 查询某人的所有通知（支持分页 + 按时间倒序排列）
     * 场景：消息中心列表加载
     */
    Page<Notification> findByReceiverUidOrderByCreatedAtDesc(String receiverUid, Pageable pageable);

    /**
     * 统计未读消息数量
     * 场景：前端 Tab 栏显示小红点 (例如：消息(5))
     */
    long countByReceiverUidAndIsReadFalse(String receiverUid);

    /**
     * 一键已读：将某人的所有消息标记为已读
     * 场景：用户点击“全部已读”按钮，或者点开消息中心时自动触发
     */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.receiverUid = :uid AND n.isRead = false")
    void markAllAsRead(@Param("uid") String uid);

    /**
     * 标记单条消息为已读
     * 场景：用户点击跳转到具体帖子时触发
     */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id AND n.receiverUid = :uid")
    void markOneAsRead(@Param("id") Long id, @Param("uid") String uid);

    /**
     * 删除某条通知
     * 场景：用户长按删除
     */
    void deleteByIdAndReceiverUid(Long id, String receiverUid);

    Notification findFirstByReceiverUidAndSenderUidAndTypeAndIsReadFalse(
    String receiverUid,
    String senderUid,
    NotificationType type
);
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.receiverUid = :receiverUid AND n.senderUid = :senderUid AND n.type = 'PRIVATE_MESSAGE'")
    void markPrivateMessageAsRead(String receiverUid, String senderUid);
}