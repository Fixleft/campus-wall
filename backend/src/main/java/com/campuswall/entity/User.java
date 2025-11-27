package com.campuswall.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="user")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @Column(name = "uid",length = 6, nullable = false)
    private String uid;

    @Column(name = "avatar", length = 255)
    private String avatar;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "signature", length = 255)
    private String signature;

    @Column(name = "hometown", length = 80)
    private String hometown;

    @Column(name = "age")
    private Integer age;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "password", nullable = false, length = 255)
    private String password;
}
