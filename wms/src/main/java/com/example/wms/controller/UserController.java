package com.example.wms.controller;

import com.example.wms.model.User;
import com.example.wms.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getAllUsers(HttpSession session) {
        // ตรวจสอบว่าผู้ใช้เป็นผู้ดูแลระบบหรือไม่
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("ไม่มีสิทธิ์เข้าถึงข้อมูล");
        }

        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, HttpSession session) {
        // ตรวจสอบสิทธิ์
        if (!hasAccessToUserData(id, session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("ไม่มีสิทธิ์เข้าถึงข้อมูล");
        }

        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody User user,
            HttpSession session) {

        // ตรวจสอบสิทธิ์
        if (!hasAccessToUserData(id, session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("ไม่มีสิทธิ์เข้าถึงข้อมูล");
        }

        try {
            User updatedUser = userService.updateUser(id, user);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, HttpSession session) {
        // ตรวจสอบว่าผู้ใช้เป็นผู้ดูแลระบบหรือไม่
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("ไม่มีสิทธิ์ลบผู้ใช้");
        }

        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * ตรวจสอบว่าผู้ใช้เป็นผู้ดูแลระบบหรือไม่
     */
    private boolean isAdmin(HttpSession session) {
        String role = (String) session.getAttribute("role");
        return role != null && role.equals("ADMIN");
    }

    /**
     * ตรวจสอบว่ามีสิทธิ์เข้าถึงข้อมูลผู้ใช้หรือไม่
     * (เป็นผู้ดูแลระบบหรือเป็นข้อมูลของตนเอง)
     */
    private boolean hasAccessToUserData(Long userId, HttpSession session) {
        String role = (String) session.getAttribute("role");
        Long sessionUserId = (Long) session.getAttribute("userId");

        return (role != null && role.equals("ADMIN")) || (userId.equals(sessionUserId));
    }
}