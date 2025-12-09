package com.campuswall.repository;

import com.campuswall.entity.FriendRequest;
import com.campuswall.enums.FriendRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    // 查找两个人之间的请求（无论谁发起的）
    @Query("SELECT r FROM FriendRequest r WHERE " +
           "(r.requesterUid = :uid1 AND r.addresseeUid = :uid2) OR " +
           "(r.requesterUid = :uid2 AND r.addresseeUid = :uid1)")
    Optional<FriendRequest> findRequestBetween(@Param("uid1") String uid1, @Param("uid2") String uid2);

    // 查询某人收到的待处理请求
    List<FriendRequest> findByAddresseeUidAndStatus(String addresseeUid, FriendRequestStatus status);

    // 查询某人的好友列表（即状态为 ACCEPTED 的记录，无论他是发起方还是接收方）
    @Query("SELECT r FROM FriendRequest r WHERE " +
           "(r.requesterUid = :uid OR r.addresseeUid = :uid) AND r.status = 'ACCEPTED'")
    List<FriendRequest> findAllFriendsByUid(@Param("uid") String uid);

    @Query("SELECT CASE WHEN fr.requesterUid = :currentUid THEN fr.addresseeUid ELSE fr.requesterUid END " +
           "FROM FriendRequest fr " +
           "WHERE fr.status = 'ACCEPTED' " +
           "AND (" +
               "(fr.requesterUid = :currentUid AND fr.addresseeUid IN :targetUids) " +
               "OR " +
               "(fr.addresseeUid = :currentUid AND fr.requesterUid IN :targetUids)" +
           ")")
    Set<String> findFriendUids(@Param("currentUid") String currentUid, @Param("targetUids") List<String> targetUids);
    @Query("SELECT COUNT(r) > 0 FROM FriendRequest r WHERE " +
           "((r.requesterUid = :uid1 AND r.addresseeUid = :uid2) OR " +
           "(r.requesterUid = :uid2 AND r.addresseeUid = :uid1)) " +
           "AND r.status = 'ACCEPTED'")
    boolean areFriends(@Param("uid1") String uid1, @Param("uid2") String uid2);

}