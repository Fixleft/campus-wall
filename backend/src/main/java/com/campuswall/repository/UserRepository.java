package com.campuswall.repository;

import com.campuswall.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByName(String name);
    Optional<User> findByUid(String uid);
    boolean existsByName(String name);
    boolean existsByUid(String uid);
    Optional<User> findByNameAndUid(String name, String uid);
}
