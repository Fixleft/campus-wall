package com.campuswall.repository;

import com.campuswall.entity.PrivateMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrivateMessageRepository extends JpaRepository<PrivateMessage, Long> {

    /**
     * 【清空功能 1】
     * 场景：我是 currentUid，我是发送方，我要删除我和 targetUid 的记录
     * 动作：把 deletedBySender 设为 true
     */
    @Modifying
    @Query("UPDATE PrivateMessage p SET p.deletedBySender = true " +
           "WHERE p.senderUid = :currentUid AND p.receiverUid = :targetUid")
    void hideMessagesSentBy(@Param("currentUid") String currentUid, @Param("targetUid") String targetUid);

    /**
     * 【清空功能 2】
     * 场景：我是 currentUid，我是接收方，我要删除 targetUid 发给我的记录
     * 动作：把 deletedByReceiver 设为 true
     */
    @Modifying
    @Query("UPDATE PrivateMessage p SET p.deletedByReceiver = true " +
           "WHERE p.receiverUid = :currentUid AND p.senderUid = :targetUid")
    void hideMessagesReceivedFrom(@Param("currentUid") String currentUid, @Param("targetUid") String targetUid);

    /**
     * 【修改后的查询】
     * 获取聊天记录时，必须排除掉用户已经“删除”的消息
     */
    @Query("SELECT p FROM PrivateMessage p WHERE " +
           "(p.senderUid = :uid1 AND p.receiverUid = :uid2 AND p.deletedBySender = false) " +
           "OR " +
           "(p.receiverUid = :uid1 AND p.senderUid = :uid2 AND p.deletedByReceiver = false) " +
           "ORDER BY p.createdAt DESC")
    Page<PrivateMessage> findChatHistory(@Param("uid1") String uid1,
                                         @Param("uid2") String uid2,
                                         Pageable pageable);



    // 统计未读消息数
    long countByReceiverUidAndIsReadFalse(String receiverUid);

    // 1. 查某人的所有消息（作为发送者或接收者），按时间倒序
    // 用于生成会话列表
    @Query("SELECT m FROM PrivateMessage m WHERE m.senderUid = :uid OR m.receiverUid = :uid ORDER BY m.createdAt DESC")
    List<PrivateMessage> findAllByUid(@Param("uid") String uid);

    // 2. 统计来自某人的未读消息数
    @Query("SELECT COUNT(m) FROM PrivateMessage m WHERE m.senderUid = :senderUid AND m.receiverUid = :myUid AND m.isRead = false")
    int countUnread(@Param("myUid") String myUid, @Param("senderUid") String senderUid);

    @Modifying
    @Query("UPDATE PrivateMessage m SET m.isRead = true " +
           "WHERE m.senderUid = :senderUid " +
           "AND m.receiverUid = :receiverUid " +
           "AND m.isRead = false")
    void markMessagesAsRead(@Param("receiverUid") String receiverUid, @Param("senderUid") String senderUid);

    @Query("SELECT m FROM PrivateMessage m WHERE " +
           "(m.senderUid = :uid1 AND m.receiverUid = :uid2) OR " +
           "(m.senderUid = :uid2 AND m.receiverUid = :uid1) " +
           "ORDER BY m.createdAt DESC")
    List<PrivateMessage> findRecentMessages(@Param("uid1") String uid1,
                                            @Param("uid2") String uid2,
                                            Pageable pageable);


}