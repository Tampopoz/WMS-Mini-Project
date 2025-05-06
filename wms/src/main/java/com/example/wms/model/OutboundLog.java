package com.example.wms.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * เอนทิตี้สำหรับเก็บข้อมูลการส่งออกสินค้าออกจากคลัง
 */
@Entity
@Table(name = "outbound_logs")
@Data
@NoArgsConstructor

public class OutboundLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;  // สินค้าที่ส่งออก

    private Integer quantityExported;  // จำนวนที่ส่งออก

    private LocalDateTime outboundDate;  // วันเวลาที่ส่งออกสินค้า

    private String customerName;  // ชื่อลูกค้า/ผู้รับสินค้า

    private String orderNumber;  // เลขที่ออเดอร์

    private String processedBy;  // ชื่อผู้ดำเนินการส่งออก

    private String notes;  // หมายเหตุเพิ่มเติม
}