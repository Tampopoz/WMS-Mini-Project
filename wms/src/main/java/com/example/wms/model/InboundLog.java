package com.example.wms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * เอนทิตี้สำหรับเก็บข้อมูลการรับสินค้าเข้าคลัง
 */
@Entity
@Table(name = "inbound_logs")
@Data
@NoArgsConstructor
public class InboundLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;  // สินค้าที่รับเข้า

    private Integer quantityReceived;  // จำนวนที่รับเข้า

    private LocalDateTime receivedDate;  // วันเวลาที่รับสินค้า

    private String supplierName;  // ชื่อซัพพลายเออร์/ผู้ส่งสินค้า

    private String referenceNumber;  // เลขที่ใบส่งสินค้า

    private String receivedBy;  // ชื่อผู้รับสินค้า
}