package com.example.wms.repository;

import com.example.wms.model.InboundLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InboundLogRepository extends JpaRepository<InboundLog, Long> {

    // ค้นหาประวัติการรับสินค้าตาม product ID
    List<InboundLog> findByProductId(Long productId);

    // ค้นหาประวัติการรับสินค้าตามช่วงเวลา
    List<InboundLog> findByReceivedDateBetween(LocalDateTime start, LocalDateTime end);

    // ค้นหาประวัติการรับสินค้าตามชื่อผู้จัดส่ง
    List<InboundLog> findBySupplierNameContaining(String supplierName);

    // ค้นหาประวัติการรับสินค้าล่าสุด
    @Query("SELECT i FROM InboundLog i ORDER BY i.receivedDate DESC")
    List<InboundLog> findRecentInbounds();
}
