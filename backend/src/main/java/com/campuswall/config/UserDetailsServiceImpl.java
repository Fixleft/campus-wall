package com.campuswall.config;

import com.campuswall.entity.User;
import com.campuswall.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String input) throws UsernameNotFoundException {
        User user = userRepository.findByUid(input).orElse(null);
        if (user == null) {
            user = userRepository.findByName(input)
                    .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + input));
        }
        boolean isEnabled = user.getEnabled();
        String roleName = (user.getRole() != null) ? user.getRole().name() : "USER";


         return new org.springframework.security.core.userdetails.User(
                user.getUid(),
                user.getPassword(),
                isEnabled, // <--- 1. 对应 enabled (是否启用)
                true,      // 2. accountNonExpired (账号未过期)
                true,      // 3. credentialsNonExpired (凭证/密码未过期)
                true,      // 4. accountNonLocked (账号未锁定)
                AuthorityUtils.createAuthorityList("ROLE_" + user.getRole().name())
        );
    }
}
