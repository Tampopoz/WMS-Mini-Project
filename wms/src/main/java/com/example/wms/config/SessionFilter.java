package com.example.wms.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * ตัวกรองเซสชั่น - ใช้ตรวจสอบว่าผู้ใช้ได้ล็อกอินหรือยัง
 */
@Component
@Order(1) // ให้ทำงานเป็นลำดับแรก ก่อนตัวกรองอื่นๆ
public class SessionFilter implements Filter {

    // กำหนดเส้นทาง (endpoint) สาธารณะที่ไม่ต้องการการยืนยันตัวตน
    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
            "/api/auth/login",     // API สำหรับล็อกอิน
            "/api/auth/register",  // API สำหรับลงทะเบียน
            "/login.html",         // หน้าล็อกอิน
            "/register.html",      // หน้าลงทะเบียน
            "/css/",               // ไฟล์ CSS ต่างๆ
            "/js/",                // ไฟล์ JavaScript ต่างๆ
            "/images/"             // รูปภาพต่างๆ
    );

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        String path = request.getRequestURI();

        // ตรวจสอบว่าเส้นทางนี้เป็นเส้นทางสาธารณะหรือไม่
        if (isPublicEndpoint(path)) {
            // ถ้าเป็นเส้นทางสาธารณะ ให้ไปต่อได้เลย ไม่ต้องตรวจสอบเซสชั่น
            chain.doFilter(request, response);
            return;
        }

        // ตรวจสอบว่ามีเซสชั่นที่แอคทีฟอยู่หรือไม่
        HttpSession session = request.getSession(false);
        Long userId = session != null ? (Long) session.getAttribute("userId") : null;

        if (userId == null) {
            // ถ้าไม่มีเซสชั่น (ไม่ได้ล็อกอิน) จะดำเนินการตามประเภทของคำขอ
            handleUnauthenticated(request, response, path);
            return;
        }

        // ถ้ามีเซสชั่น (ล็อกอินแล้ว) ก็ปล่อยให้ไปต่อได้
        chain.doFilter(request, response);
    }

    /**
     * ตรวจสอบว่าเส้นทางนี้เป็นเส้นทางสาธารณะหรือไม่
     */
    private boolean isPublicEndpoint(String path) {
        return PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith);
    }

    /**
     * จัดการกรณีผู้ใช้ยังไม่ได้ล็อกอิน
     */
    private void handleUnauthenticated(HttpServletRequest request,
                                       HttpServletResponse response,
                                       String path) throws IOException {
        if (path.startsWith("/api/")) {
            // สำหรับ API จะส่งรหัสสถานะ 401 (Unauthorized)
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        } else {
            // สำหรับหน้าเว็บทั่วไป จะเปลี่ยนเส้นทางไปที่หน้าล็อกอิน
            response.sendRedirect("/login.html");
        }
    }
}