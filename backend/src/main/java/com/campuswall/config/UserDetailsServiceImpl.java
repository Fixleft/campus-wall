package com.campuswall.config;

import com.campuswall.entity.User;
import com.campuswall.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String uid) throws UsernameNotFoundException {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + uid));
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUid())
                .password(user.getPassword())
                .authorities("USER")
                .build();
    }
}
