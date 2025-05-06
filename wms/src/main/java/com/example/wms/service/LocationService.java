package com.example.wms.service;

import com.example.wms.model.Location;
import com.example.wms.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    /**
     * ดึงข้อมูลตำแหน่งทั้งหมด
     */
    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    /**
     * ดึงข้อมูลตำแหน่งตาม ID
     */
    public Optional<Location> getLocationById(Long id) {
        return locationRepository.findById(id);
    }

    /**
     * สร้างตำแหน่งใหม่
     */
    @Transactional
    public Location createLocation(Location location) {
        // ตรวจสอบว่ามีชื่อตำแหน่งซ้ำหรือไม่
        if (locationRepository.existsByName(location.getName())) {
            throw new RuntimeException("ตำแหน่งที่มีชื่อ '" + location.getName() + "' มีอยู่แล้ว ไม่สามารถสร้างซ้ำได้");
        }
        return locationRepository.save(location);
    }

    /**
     * อัปเดตข้อมูลตำแหน่ง
     */
    @Transactional
    public Location updateLocation(Long id, Location location) {
        // ใช้เมธอดที่สร้างขึ้นใหม่เพื่อตรวจสอบการมีอยู่ของตำแหน่ง
        Location existingLocation = getLocationOrThrow(id);

        // ตรวจสอบว่ามีชื่อตำแหน่งซ้ำหรือไม่ (เฉพาะกรณีชื่อมีการเปลี่ยนแปลง)
        if (!existingLocation.getName().equals(location.getName()) &&
                locationRepository.existsByName(location.getName())) {
            throw new RuntimeException("ตำแหน่งที่มีชื่อ '" + location.getName() + "' มีอยู่แล้ว ไม่สามารถแก้ไขซ้ำได้");
        }

        location.setId(id);
        return locationRepository.save(location);
    }

    /**
     * ลบตำแหน่ง
     */
    @Transactional
    public void deleteLocation(Long id) {
        // ใช้เมธอดที่สร้างขึ้นใหม่เพื่อตรวจสอบการมีอยู่ของตำแหน่ง
        Location location = getLocationOrThrow(id);

        // ตรวจสอบว่าตำแหน่งนี้ยังมีการใช้งานอยู่หรือไม่
        if (location.getCurrentUtilization() > 0) {
            throw new RuntimeException("ไม่สามารถลบตำแหน่งที่ยังมีสินค้าอยู่ได้ โปรดย้ายสินค้าออกก่อน");
        }

        locationRepository.deleteById(id);
    }

    /**
     * ดึงข้อมูลตำแหน่งที่พร้อมใช้งาน
     */
    public List<Location> getAvailableLocations() {
        return locationRepository.findAvailableLocations();
    }

    /**
     * ค้นหาตำแหน่งตามคำค้น
     */
    public List<Location> searchLocations(String keyword) {
        return locationRepository.findByNameContaining(keyword);
    }

    /**
     * ดึงข้อมูลตำแหน่งตามประเภท
     */
    public List<Location> getLocationsByType(String type) {
        return locationRepository.findByType(type);
    }

    /**
     * ดึงข้อมูลตำแหน่งตามโซน
     */
    public List<Location> getLocationsBySection(String section) {
        return locationRepository.findBySection(section);
    }

    /**
     * ค้นหาตำแหน่งตาม ID หรือส่ง Exception ถ้าไม่พบ
     */
    private Location getLocationOrThrow(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบตำแหน่งที่ระบุ ID: " + id));
    }

    /**
     * นับจำนวนตำแหน่งทั้งหมดในระบบ
     */
    public long getLocationCount() {
        return locationRepository.count();
    }
}
