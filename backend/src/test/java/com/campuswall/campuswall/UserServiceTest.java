package com.campuswall.campuswall;
import com.campuswall.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class UserServiceTest {
    @Autowired
    private UserService userService;

    @Test
    public void testResetPassword() {
        // 这里填入你想重置密码的那个用户的 UID
        String targetUid = "203491";
        String newPassword = "123456";

        System.out.println("开始重置密码...");

        // 2. 直接调用 Service 方法
        try {
            userService.resetPassword(targetUid, newPassword);
            System.out.println("✅ 密码重置成功！");
        } catch (Exception e) {
            System.err.println("❌ 重置失败: " + e.getMessage());
        }
    }
}
