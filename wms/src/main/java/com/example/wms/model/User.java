package com.example.wms.model; //ระบุที่อยู่ของไฟล์

import jakarta.persistence.*; //ไลบรารีเชื่อมต่อกับฐานข้อมูล
import lombok.Data; //เป็นไลบรารีที่ช่วยลดโค้ด เช่น getter, setter

/**
 * เอนทิตี้สำหรับเก็บข้อมูลผู้ใช้ในระบบ
 */

//@ เรียกว่า Annotation เป็นการกำหนดคุณสมบัติพิเศษให้กับคลาส

@Entity //คลาสนี้เป็นตารางในฐานข้อมูล
@Table(name = "users") //กำหนดชื่อตารางในฐานข้อมูลว่า "users"
@Data //เป็น Annotation จาก Lombok ที่จะสร้าง getter, setter และ toString ให้อัตโนมัติ

public class User {

    @Id //ระบุว่าฟิลด์นี้เป็น Primary Key
    @GeneratedValue(strategy = GenerationType.IDENTITY) //กำหนดวิธีการสร้างค่า ID อัตโนมัติ
    private Long id;

    @Column(unique = true) // ชื่อผู้ใช้ต้องไม่ซ้ำกัน
    private String username;

    private String password;

    private String fullName; // ชื่อ-นามสกุลของผู้ใช้

    // เปลี่ยนเป็น
    private String role; // บทบาทในระบบ

    // ค่าคงที่สำหรับบทบาท
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_EMPLOYEE = "EMPLOYEE";

    public boolean isAdmin() {
        return ROLE_ADMIN.equals(role);
    }
}