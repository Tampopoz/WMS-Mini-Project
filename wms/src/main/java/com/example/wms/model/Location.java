package com.example.wms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * เอนทิตี้สำหรับเก็บข้อมูลตำแหน่งในคลังสินค้า
 */
@Entity
@Table(name = "locations")
@Data
@NoArgsConstructor
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;  // ชื่อตำแหน่ง เช่น A123

    private String type;  // ประเภทของตำแหน่ง เช่น ชั้นวาง, พาเลท, ตู้เย็น

    private int capacity;  // ความจุสูงสุดของตำแหน่ง

    private int currentUtilization;  // ปริมาณที่ใช้ไปแล้ว

    private String status = "พร้อมใช้งาน";  // สถานะของตำแหน่ง (พร้อมใช้งาน, ปิดซ่อมบำรุง)

    private String section;  // โซนในคลังสินค้า เช่น A, B, C

    private String level;  // ระดับชั้น เช่น 1, 2, 3

    private String position;  // ตำแหน่งย่อย เช่น 01, 02, 03

    // ฟิลด์ที่คำนวณได้จากฟิลด์อื่น
    @Transient
    private boolean available;  // พร้อมใช้งานหรือไม่

    @Transient
    private int availableCapacity;  // ความจุที่เหลืออยู่

    /**
     * อัปเดตค่าที่คำนวณได้ (available, availableCapacity)
     */
    @PostLoad
    @PrePersist
    @PreUpdate
    public void updateCalculatedFields() {
        // ตำแหน่งพร้อมใช้งานเมื่อ:
        // 1. มีพื้นที่ว่างเหลืออยู่ และ
        // 2. สถานะเป็น "พร้อมใช้งาน"
        this.available = (currentUtilization < capacity) &&
                (status != null && status.equals("พร้อมใช้งาน"));

        // คำนวณพื้นที่ว่างที่เหลืออยู่
        this.availableCapacity = capacity - currentUtilization;
    }
}