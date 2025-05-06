package com.example.wms.controller;

import com.example.wms.model.Location;
import com.example.wms.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * คอนโทรลเลอร์สำหรับจัดการตำแหน่งในคลังสินค้า
 */
@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    /**
     * ดึงข้อมูลตำแหน่งทั้งหมด
     */
    @GetMapping
    public ResponseEntity<List<Location>> getAllLocations() {
        List<Location> locations = locationService.getAllLocations();
        return ResponseEntity.ok(locations);
    }

    /**
     * ดึงข้อมูลตำแหน่งตาม ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Location> getLocationById(@PathVariable Long id) {
        try {
            Location location = locationService.getLocationById(id)
                    .orElseThrow(() -> new RuntimeException("ไม่พบตำแหน่งที่ระบุ ID: " + id));
            return ResponseEntity.ok(location);
        } catch (RuntimeException e) {
            throw e; // จะถูกจัดการโดย GlobalExceptionHandler
        }
    }

    /**
     * สร้างตำแหน่งใหม่
     */
    @PostMapping
    public ResponseEntity<Location> createLocation(@Valid @RequestBody Location location) {
        Location createdLocation = locationService.createLocation(location);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdLocation);
    }

    /**
     * อัปเดตข้อมูลตำแหน่ง
     */
    @PutMapping("/{id}")
    public ResponseEntity<Location> updateLocation(
            @PathVariable Long id,
            @Valid @RequestBody Location location) {
        Location updatedLocation = locationService.updateLocation(id, location);
        return ResponseEntity.ok(updatedLocation);
    }

    /**
     * ลบตำแหน่ง
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok().build();
    }

    /**
     * ดึงข้อมูลตำแหน่งที่ว่างอยู่
     */
    @GetMapping("/available")
    public ResponseEntity<List<Location>> getAvailableLocations() {
        List<Location> availableLocations = locationService.getAvailableLocations();
        return ResponseEntity.ok(availableLocations);
    }

    /**
     * ค้นหาตำแหน่งตามคำค้น
     */
    @GetMapping("/search")
    public ResponseEntity<List<Location>> searchLocations(@RequestParam String keyword) {
        List<Location> locations = locationService.searchLocations(keyword);
        return ResponseEntity.ok(locations);
    }

    /**
     * ดึงข้อมูลตำแหน่งตามประเภท
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Location>> getLocationsByType(@PathVariable String type) {
        List<Location> locations = locationService.getLocationsByType(type);
        return ResponseEntity.ok(locations);
    }

    /**
     * ดึงข้อมูลตำแหน่งตามโซน
     */
    @GetMapping("/section/{section}")
    public ResponseEntity<List<Location>> getLocationsBySection(@PathVariable String section) {
        List<Location> locations = locationService.getLocationsBySection(section);
        return ResponseEntity.ok(locations);
    }

    /**
     * ดึงข้อมูลจำนวนตำแหน่งทั้งหมดในระบบ
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getLocationCount() {
        long totalLocations = locationService.getLocationCount();
        Map<String, Object> response = new HashMap<>();
        response.put("total", totalLocations);
        return ResponseEntity.ok(response);
    }
}