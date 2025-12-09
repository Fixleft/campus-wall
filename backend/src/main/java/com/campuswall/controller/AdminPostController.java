package com.campuswall.controller;

import com.campuswall.dto.PostResponseDto;
import com.campuswall.entity.Post;
import com.campuswall.repository.PostRepository;
import com.campuswall.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/post")
@RequiredArgsConstructor
public class AdminPostController {

    private final PostService postService;
    private final PostRepository postRepository;

   @GetMapping("/list")
    public ResponseEntity<Page<PostResponseDto>> getPostList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
   ) {
       return ResponseEntity.ok(postService.searchAdminPosts(keyword, status, page, size));
   }

    @PostMapping("/{postId}/block")
    public ResponseEntity<String> blockPost(@PathVariable Long postId) {
       postService.blockPost(postId);
       return ResponseEntity.ok("帖子已下架");
    }

    @PostMapping("/{postId}/unblock")
    public ResponseEntity<String> unblockPost(@PathVariable Long postId) {
       postService.unBlockPost(postId);
       return ResponseEntity.ok("帖子已恢复");
    }

    @DeleteMapping("/{postId}/delete")
    public ResponseEntity<String> deletePost(@PathVariable Long postId) {
        postService.deletePostPhysically(postId);
        return ResponseEntity.ok("帖子已彻底删除");
    }


}
