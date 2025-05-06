package com.example.wms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * เอนทิตี้สำหรับเก็บข้อมูลสินค้าในคลังสินค้า
 */

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;  // ชื่อสินค้า

    private String description;  // รายละเอียดสินค้า

    private int quantity = 0;  // จำนวนสินค้าในคลัง

    private String location;  // ตำแหน่งที่เก็บสินค้า

    private int minimumStock = 10;  // จำนวนขั้นต่ำที่ควรมีในคลัง

    // เพิ่มฟิลด์สำหรับติดตามว่าสินค้านี้ถูกสร้างจากการโอนย้ายใด
    private Long createdByTransferId;  // ID ของการโอนย้ายที่สร้างสินค้านี้

    // ฟิลด์ที่คำนวณได้
    @Transient
    private boolean lowStock;  // สถานะสินค้าใกล้หมด

    /**
     * Constructor สำหรับสร้างสินค้าใหม่ (ฟิลด์ที่จำเป็น)
     */
    public Product(String name, int minimumStock) {
        this.name = name;
        this.minimumStock = minimumStock;
        this.quantity = 0;
        updateLowStockStatus();
    }

    /**
     * ตรวจสอบว่าสินค้านี้มีจำนวนต่ำกว่าขั้นต่ำที่กำหนดไว้หรือไม่
     */
    @PostLoad
    @PrePersist
    @PreUpdate
    public void updateLowStockStatus() {
        this.lowStock = quantity < minimumStock;
    }
}