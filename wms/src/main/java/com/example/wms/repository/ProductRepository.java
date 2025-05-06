package com.example.wms.repository;

import com.example.wms.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * รีพอสิทอรีสำหรับการจัดการข้อมูลสินค้า
 * มีเมธอดค้นหาพิเศษสำหรับการตรวจสอบสินค้าคงคลัง
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * ค้นหาสินค้าจากชื่อที่มีคำคล้ายกัน
     */
    List<Product> findByNameContaining(String name);

    /**
     * ค้นหาสินค้าที่มีจำนวนต่ำกว่าขั้นต่ำที่กำหนด (สินค้าใกล้หมด)
     */
    @Query("SELECT p FROM Product p WHERE p.quantity < p.minimumStock")
    List<Product> findLowStockProducts();

    /**
     * ค้นหาสินค้าตามตำแหน่งที่เก็บ
     */
    List<Product> findByLocation(String location);
}