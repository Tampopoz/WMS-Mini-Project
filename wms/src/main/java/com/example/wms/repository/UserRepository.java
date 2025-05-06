package com.example.wms.repository;

import com.example.wms.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * รีพอสิทอรีสำหรับการจัดการข้อมูลผู้ใช้
 * มีเมธอดค้นหาผู้ใช้ตามชื่อผู้ใช้และตรวจสอบว่ามีชื่อผู้ใช้นี้อยู่ในระบบแล้วหรือไม่
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * ค้นหาผู้ใช้ตามชื่อผู้ใช้
     */
    Optional<User> findByUsername(String username);

    /**
     * ตรวจสอบว่ามีชื่อผู้ใช้นี้อยู่ในระบบแล้วหรือไม่
     */
    boolean existsByUsername(String username);

    /**
     * ตรวจสอบว่ามีชื่อ-นามสกุลนี้อยู่ในระบบแล้วหรือไม่
     */
    boolean existsByFullName(String fullName);
}