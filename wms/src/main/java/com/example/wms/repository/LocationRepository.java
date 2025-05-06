package com.example.wms.repository;

import com.example.wms.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * รีพอสิทอรีสำหรับการจัดการข้อมูลตำแหน่ง
 * มีเมธอดค้นหาหลายรูปแบบเพื่อให้ใช้งานได้สะดวก
 */
@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    /**
     * ค้นหาตำแหน่งจากชื่อที่มีคำคล้ายกัน
     */
    List<Location> findByNameContaining(String name);

    /**
     * ตรวจสอบว่ามีตำแหน่งที่มีชื่อนี้อยู่แล้วหรือไม่
     */
    boolean existsByName(String name);

    /**
     * ค้นหาตำแหน่งตามประเภท
     */
    List<Location> findByType(String type);

    /**
     * ค้นหาตำแหน่งตามโซน
     */
    List<Location> findBySection(String section);

    /**
     * ค้นหาตำแหน่งที่ยังว่างอยู่ (current utilization < capacity)
     */
    @Query("SELECT l FROM Location l WHERE l.currentUtilization < l.capacity")
    List<Location> findAvailableLocations();

    /**
     * ค้นหาตำแหน่งตามโซนและระดับชั้น
     */
    @Query("SELECT l FROM Location l WHERE l.section = ?1 AND l.level = ?2")
    List<Location> findBySectionAndLevel(String section, String level);
}