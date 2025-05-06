package com.example.wms.repository;

import com.example.wms.model.OutboundLog;
import com.example.wms.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * รีพอสิทอรีสำหรับการจัดการข้อมูลการส่งออกสินค้า
 */
@Repository
public interface OutboundLogRepository extends JpaRepository<OutboundLog, Long> {

    /**
     * ค้นหาประวัติการส่งออกสินค้าตาม product
     */
    List<OutboundLog> findByProduct(Product product);

    /**
     * ค้นหาประวัติการส่งออกสินค้าตามช่วงเวลา
     */
    List<OutboundLog> findByOutboundDateBetween(LocalDateTime start, LocalDateTime end);

    /**
     * ค้นหาประวัติการส่งออกสินค้าตามชื่อลูกค้า
     */
    List<OutboundLog> findByCustomerNameContaining(String customerName);

    /**
     * ค้นหาประวัติการส่งออกสินค้าตามเลขที่ออเดอร์
     */
    List<OutboundLog> findByOrderNumberContaining(String orderNumber);

    /**
     * ค้นหาประวัติการส่งออกสินค้าตามผู้ดำเนินการ
     */
    List<OutboundLog> findByProcessedByContaining(String processedBy);

    /**
     * ค้นหาประวัติการส่งออกสินค้าล่าสุด
     */
    @Query("SELECT o FROM OutboundLog o ORDER BY o.outboundDate DESC")
    List<OutboundLog> findRecentOutbounds();

    /**
     * ค้นหาประวัติการส่งออกสินค้าตามคำค้นหา (ลูกค้าหรือเลขที่ออเดอร์)
     */
    @Query("SELECT o FROM OutboundLog o WHERE o.customerName LIKE %?1% OR o.orderNumber LIKE %?1%")
    List<OutboundLog> searchOutbounds(String keyword);
}