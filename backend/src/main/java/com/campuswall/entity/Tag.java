package com.campuswall.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;


import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "tag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    // 1. 改为 Set
    @ManyToMany(mappedBy = "tags")
    @JsonIgnore
    @ToString.Exclude
    private Set<Post> posts = new HashSet<>();

    public Tag(String name) {
        this.name = name;
    }

    // 2. 修正 equals：使用 instanceof 兼容 Hibernate 代理对象
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        // 关键修改：不要用 getClass()，要用 instanceof
        if (!(o instanceof Tag)) return false;

        Tag other = (Tag) o;

        // 处理 id 为 null 的情况 (新创建的对象)
        if (this.getId() == null || other.getId() == null) {
            return false;
        }

        // 比较 ID
        return Objects.equals(this.getId(), other.getId());
    }

    // 3. 修正 hashCode：建议返回常量，防止放入 Set 后 ID 变化导致丢失
    @Override
    public int hashCode() {
        // 返回常量是 JPA 实体最佳实践，虽然性能稍低，但在 HashSet 中绝对安全
        return 17564064; // 或者 getClass().hashCode()，但常量最稳
    }
}