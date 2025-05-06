package com.example.wms.controller;

import com.example.wms.model.User;
import com.example.wms.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * คอนโทรลเลอร์สำหรับการจัดการการยืนยันตัวตน
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    /**
     * สร้างคลาสสำหรับรับข้อมูลการล็อกอิน
     */
    private record LoginRequest(String username, String password) {}

    /**
     * API สำหรับการลงทะเบียนผู้ใช้ใหม่
     */
    @PostMapping("/register")
    public ResponseEntity<Object> registerUser(@Valid @RequestBody User user) {
        try {
            User createdUser = userService.registerUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * API สำหรับการล็อกอิน
     */
    @PostMapping("/login")
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest loginRequest, HttpSession session) {
        // ตรวจสอบชื่อผู้ใช้และรหัสผ่าน
        if (userService.validateUser(loginRequest.username(), loginRequest.password())) {
            // ดึงข้อมูลผู้ใช้
            User user = userService.findByUsername(loginRequest.username())
                    .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลผู้ใช้"));

            // เก็บข้อมูลผู้ใช้ไว้ในเซสชั่น
            session.setAttribute("userId", user.getId());
            session.setAttribute("username", user.getUsername());
            session.setAttribute("role", user.getRole());

            return ResponseEntity.ok(user);
        } else {
            // ล็อกอินไม่สำเร็จ
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        }
    }

    /**
     * API สำหรับการล็อกเอาท์
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpSession session) {
        // ยกเลิกเซสชั่น
        session.invalidate();
        return ResponseEntity.ok("ล็อกเอาท์สำเร็จ");
    }

    /**
     * API สำหรับตรวจสอบสถานะเซสชั่นปัจจุบัน
     */
    @GetMapping("/check-session")
    public ResponseEntity<Object> checkSession(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId != null) {
            // ถ้ามีการล็อกอิน จะส่งข้อมูลผู้ใช้กลับไป
            return ResponseEntity.ok(
                    Map.of(
                            "userId", userId,
                            "username", session.getAttribute("username"),
                            "role", session.getAttribute("role")
                    )
            );
        } else {
            // ถ้าไม่มีการล็อกอิน
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("ไม่มีเซสชั่นที่แอคทีฟ");
        }
    }
}