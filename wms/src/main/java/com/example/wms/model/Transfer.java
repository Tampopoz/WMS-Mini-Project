package com.example.wms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * เอนทิตี้สำหรับเก็บข้อมูลการโอนย้ายสินค้าระหว่างตำแหน่งในคลังสินค้า
 */
@Entity
@Table(name = "transfers")
@Data
@NoArgsConstructor
public class Transfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private String fromLocation;

    private String toLocation;

    private Integer quantityTransferred;

    private LocalDateTime transferDate;

    private String transferBy; // ชื่อผู้ทำรายการโอนย้าย

    private String notes; // บันทึกเพิ่มเติม
}