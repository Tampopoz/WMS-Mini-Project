package com.example.wms.service;

import com.example.wms.model.User;
import com.example.wms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * ลงทะเบียนผู้ใช้ใหม่
     */
    @Transactional
    public User registerUser(User user) {
        // ตรวจสอบข้อมูลนำเข้า
        validateUserInput(user);

        validateUniqueUsername(user.getUsername());
        validateUniqueFullName(user.getFullName());
        return userRepository.save(user);
    }

    /**
     * ค้นหาผู้ใช้ตามชื่อผู้ใช้
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * ตรวจสอบความถูกต้องของชื่อผู้ใช้และรหัสผ่าน
     */
    public boolean validateUser(String username, String password) {
        return userRepository.findByUsername(username)
                .map(user -> user.getPassword().equals(password))
                .orElse(false);
    }

    /**
     * ดึงข้อมูลผู้ใช้ทั้งหมด
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * ดึงข้อมูลผู้ใช้ตาม ID
     */
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * ลบผู้ใช้
     */
    @Transactional
    public void deleteUser(Long id) {
        getUserOrThrow(id); // ตรวจสอบว่ามีผู้ใช้อยู่หรือไม่
        userRepository.deleteById(id);
    }

    /**
     * อัปเดตข้อมูลผู้ใช้
     */
    @Transactional
    public User updateUser(Long id, User updatedUser) {
        User user = getUserOrThrow(id);

        // ตรวจสอบการเปลี่ยนแปลงชื่อผู้ใช้
        if (updatedUser.getUsername() != null && !updatedUser.getUsername().isEmpty() &&
                !user.getUsername().equals(updatedUser.getUsername())) {
            validateUniqueUsername(updatedUser.getUsername());
            user.setUsername(updatedUser.getUsername());
        }

        // ตรวจสอบการเปลี่ยนแปลงชื่อ-นามสกุล
        if (updatedUser.getFullName() != null && !updatedUser.getFullName().isEmpty() &&
                !user.getFullName().equals(updatedUser.getFullName())) {
            validateUniqueFullName(updatedUser.getFullName());
            user.setFullName(updatedUser.getFullName());
        }

        // อัปเดตบทบาทเฉพาะเมื่อมีการระบุมา
        if (updatedUser.getRole() != null) {
            user.setRole(updatedUser.getRole());
        }

        // อัปเดตรหัสผ่านเฉพาะเมื่อมีการระบุมา
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            user.setPassword(updatedUser.getPassword());
        }

        return userRepository.save(user);
    }

    /**
     * ตรวจสอบความถูกต้องของข้อมูลผู้ใช้
     */
    private void validateUserInput(User user) {
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new RuntimeException("ต้องระบุชื่อผู้ใช้");
        }

        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new RuntimeException("ต้องระบุรหัสผ่าน");
        }

        if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
            throw new RuntimeException("ต้องระบุชื่อ-นามสกุล");
        }
    }

    /**
     * ตรวจสอบว่าชื่อผู้ใช้ไม่ซ้ำกับที่มีอยู่ในระบบ
     */
    private void validateUniqueUsername(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
        }
    }

    /**
     * ตรวจสอบว่าชื่อ-นามสกุลไม่ซ้ำกับที่มีอยู่ในระบบ
     */
    private void validateUniqueFullName(String fullName) {
        if (userRepository.existsByFullName(fullName)) {
            throw new RuntimeException("ชื่อ-นามสกุลนี้ถูกใช้งานแล้ว");
        }
    }

    /**
     * ค้นหาผู้ใช้ตาม ID หรือส่ง Exception ถ้าไม่พบ
     */
    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้ที่ระบุ ID: " + id));
    }
}
