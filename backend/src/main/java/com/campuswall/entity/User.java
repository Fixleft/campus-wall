// User.java
package com.campuswall.entity;

import com.campuswall.enums.UserRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @Column(name = "uid", length = 6, nullable = false)
    private String uid;

    @Column(name = "avatar", length = 255, columnDefinition = "varchar(255) default 'src/assets/avatars/default-avatar.png'")
    private String avatar = "src/assets/default-avatar.png";

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "signature", length = 255, columnDefinition = "varchar(255) default '这个家伙很懒，什么都没写~'")
    private String signature = "这个家伙很懒，什么都没写~";

    @Column(name = "hometown", length = 80, columnDefinition = "varchar(80) default '地球'")
    private String hometown = "地球";

    @Column(name = "age", columnDefinition = "int default 18")
    private Integer age = 18;

    @Column(name = "gender", length = 10, columnDefinition = "varchar(10) default '保密'")
    private String gender = "保密";

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, columnDefinition = "varchar(20) default 'USER'")
    private UserRole role = UserRole.USER;

    @Column(nullable = false, columnDefinition ="boolean default true")
    private Boolean enabled = true;

    @Column(name = "mute_end_time")
    private LocalDateTime muteEndTime;

    @CreatedDate
    @Column(nullable = false, columnDefinition = "datetime default now()")
    private LocalDateTime createdAt;
}