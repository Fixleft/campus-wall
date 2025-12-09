package com.campuswall.service;

import com.campuswall.dto.FriendDto;
import com.campuswall.dto.FriendRequestDto;
import com.campuswall.entity.FriendRequest;
import com.campuswall.entity.User;
import com.campuswall.enums.FriendRequestStatus;
import com.campuswall.repository.FriendRequestRepository;
import com.campuswall.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;


     public List<FriendRequestDto> getPendingRequestsDto(String currentUid) {
        // 1. 查出 Entity
        List<FriendRequest> requests = friendRequestRepository.findByAddresseeUidAndStatus(currentUid, FriendRequestStatus.PENDING);

        // 2. 转换为 DTO (填充申请人信息)
        return requests.stream().map(req -> {
            User requester = userRepository.findById(req.getRequesterUid()).orElse(null);
            if (requester == null) return null;

            FriendRequestDto dto = new FriendRequestDto();
            dto.setId(req.getId());
            dto.setUid(requester.getUid());
            dto.setName(requester.getName());
            dto.setAvatar(requester.getAvatar());
            dto.setCreatedAt(req.getCreatedAt());
            return dto;
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    public Set<String> getFriendUidsFromList(String currentUid, List<String> targetUids) {
    // SQL: SELECT uid FROM friend_request WHERE (requester=me AND addressee IN targets AND status=ACCEPTED) OR (...)
    // 为了简单，这里先写伪代码，建议在 Repository 写 JPQL

    // 简单实现 (可能有性能瓶颈，建议优化为 SQL IN 查询)
    Set<String> friendUids = new HashSet<>();
    for (String target : targetUids) {
        if (isFriend(currentUid, target)) {
            friendUids.add(target);
        }
    }
    return friendUids;
}
     // 获取我的好友列表
    public List<FriendDto> getMyFriends(String currentUid) {
        // 1. 查出所有状态为 ACCEPTED 的记录
        List<FriendRequest> requests = friendRequestRepository.findAllFriendsByUid(currentUid);

        // 2. 转换：分辨谁是好友（如果我是发起方，对方就是接收方；反之亦然）
        return requests.stream().map(req -> {
            String friendUid = req.getRequesterUid().equals(currentUid)
                             ? req.getAddresseeUid()
                             : req.getRequesterUid();

            // 这里可能会有 N+1 问题，生产环境建议用 IN 查询批量优化
            // 但为了代码简单，这里先直接查 User
            User friend = userRepository.findById(friendUid).orElse(null);
            if (friend == null) return null;

            return new FriendDto(
                friend.getUid(),
                friend.getName(),
                friend.getAvatar(),
                friend.getSignature()
            );
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    // 删除好友
    @Transactional
    public void deleteFriend(String currentUid, String friendUid) {
        FriendRequest request = friendRequestRepository.findRequestBetween(currentUid, friendUid)
                .orElseThrow(() -> new RuntimeException("并非好友关系"));

        // 物理删除记录，或者将其状态改为 REJECTED/DELETED
        friendRequestRepository.delete(request);
    }

    // 发送好友请求
    @Transactional
    public void sendFriendRequest(String requesterUid, String addresseeUid) {
        if (requesterUid.equals(addresseeUid)) throw new RuntimeException("不能添加自己为好友");

        // 检查是否已经有请求或已经是好友
        Optional<FriendRequest> existing = friendRequestRepository.findRequestBetween(requesterUid, addresseeUid);
        if (existing.isPresent()) {
            FriendRequestStatus status = existing.get().getStatus();
            if (status == FriendRequestStatus.ACCEPTED) throw new RuntimeException("已经是好友了");
            if (status == FriendRequestStatus.PENDING) throw new RuntimeException("请求已发送，请等待对方处理");

            // 如果是被拒绝的，可以重新激活为 PENDING
            existing.get().setStatus(FriendRequestStatus.PENDING);
            existing.get().setRequesterUid(requesterUid); // 更新发起人
            existing.get().setAddresseeUid(addresseeUid);
            friendRequestRepository.save(existing.get());
            return;
        }

        FriendRequest request = new FriendRequest(requesterUid, addresseeUid);
        friendRequestRepository.save(request);
    }

    // 处理好友请求（同意/拒绝）
    @Transactional
    public void handleFriendRequest(Long requestId, String currentUid, boolean accept) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("请求不存在"));

        if (!request.getAddresseeUid().equals(currentUid)) {
            throw new RuntimeException("无权处理此请求");
        }

        request.setStatus(accept ? FriendRequestStatus.ACCEPTED : FriendRequestStatus.REJECTED);
        friendRequestRepository.save(request);
    }

    // 判断两人是否是好友
    public boolean isFriend(String uid1, String uid2) {
        return friendRequestRepository.findRequestBetween(uid1, uid2)
                .map(r -> r.getStatus() == FriendRequestStatus.ACCEPTED)
                .orElse(false);
    }

    // 获取待处理的请求列表
    public List<FriendRequest> getPendingRequests(String currentUid) {
        return friendRequestRepository.findByAddresseeUidAndStatus(currentUid, FriendRequestStatus.PENDING);
    }
}