package com.campuswall.service;

import com.campuswall.dto.CommentRequest;
import com.campuswall.entity.Comment;
import com.campuswall.vo.CommentVO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentService {

    public void deleteCommentByAdmin(Long commentId);

    public Page<Comment> searchAdminComments(Long postId, String keyword, int page, int size);

    /**
     * 发布评论（含一级楼层和二级回复）
     * @param uid 当前登录用户UID
     * @param request 请求参数
     */
    CommentVO publishComment(String uid, CommentRequest request);

    /**
     * 删除评论
     * @param commentId 评论ID
     * @param uid 当前操作人UID
     */
    void deleteComment(Long commentId, String uid);

    /**
     * 点赞评论
     */
    void likeComment(Long commentId, String uid);

    /**
     * 取消点赞
     */
    void unlikeComment(Long commentId, String uid);

    /**
     * 获取帖子的一级评论（楼层）列表
     * @param postId 帖子ID
     * @param currentUid 当前登录用户（用于判断isLiked），未登录传null
     */
    Page<CommentVO> getPostFloors(Long postId, String currentUid, Pageable pageable);

    /**
     * 获取某楼层下的所有子回复
     * @param rootId 根评论ID
     * @param currentUid 当前登录用户
     */
    List<CommentVO> getFloorReplies(Long rootId, String currentUid);
}