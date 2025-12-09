package com.campuswall.repository;

import com.campuswall.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByName(String name);
    Optional<User> findByUid(String uid);
    boolean existsByName(String name);
    boolean existsByUid(String uid);

    @Query("SELECT u FROM User u WHERE u.uid = :keyword OR u.name LIKE %:keyword%")
    List<User> searchUsers(@Param("keyword") String keyword);

    /**
     * 组合搜索用户
     * @param keyword  搜索关键词（匹配 UID 或 昵称）
     * @param enabled  账号状态（true:正常, false:封禁, null:全部）
     * @param pageable 分页参数
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:keyword IS NULL OR u.uid LIKE %:keyword% OR u.name LIKE %:keyword%) " +
           "AND " +
           "(:enabled IS NULL OR u.enabled = :enabled)")
    Page<User> searchUsers(@Param("keyword") String keyword,
                           @Param("enabled") Boolean enabled,
                           Pageable pageable);

    long countByCreatedAtAfter(LocalDateTime dateTime);
}
