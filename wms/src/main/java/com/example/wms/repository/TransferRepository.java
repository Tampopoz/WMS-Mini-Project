package com.example.wms.repository;

import com.example.wms.model.Product;
import com.example.wms.model.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * รีพอสิทอรีสำหรับการจัดการข้อมูลการโอนย้ายสินค้า
 */
@Repository
public interface TransferRepository extends JpaRepository<Transfer, Long> {

    /**
     * ค้นหาการโอนย้ายตาม product
     */
    List<Transfer> findByProduct(Product product);

    /**
     * ค้นหาการโอนย้ายล่าสุด
     */
    @Query("SELECT t FROM Transfer t ORDER BY t.transferDate DESC")
    List<Transfer> findRecentTransfers();

    /**
     * ค้นหาการโอนย้ายตามชื่อสินค้า (ตรงกันทุกตัวอักษร)
     */
    List<Transfer> findByProduct_Name(String productName);
}
