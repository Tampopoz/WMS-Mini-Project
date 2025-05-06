package com.example.wms.controller;

import com.example.wms.model.InboundLog;
import com.example.wms.service.InboundLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * คอนโทรลเลอร์สำหรับการจัดการข้อมูลการรับสินค้า
 */
@RestController
@RequestMapping("/api/inbound")
@RequiredArgsConstructor
public class InboundLogController {

    private static final Logger logger = Logger.getLogger(InboundLogController.class.getName());

    private final InboundLogService inboundLogService;

    /**
     * ดึงข้อมูลการรับสินค้าทั้งหมด
     */
    @GetMapping
    public ResponseEntity<List<InboundLog>> getAllInboundLogs() {
        return ResponseEntity.ok(inboundLogService.getAllInboundLogs());
    }

    /**
     * ดึงข้อมูลการรับสินค้าตาม ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<InboundLog> getInboundLogById(@PathVariable Long id) {
        Optional<InboundLog> inboundLog = inboundLogService.getInboundLogById(id);
        return inboundLog.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * สร้างบันทึกการรับสินค้าใหม่
     */
    @PostMapping
    public ResponseEntity<InboundLog> createInboundLog(@RequestBody InboundLog inboundLog) {
        try {
            InboundLog createdInboundLog = inboundLogService.createInboundLog(inboundLog);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdInboundLog);
        } catch (Exception e) {
            logger.severe("เกิดข้อผิดพลาดในการสร้างบันทึกการรับสินค้า: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * อัปเดตข้อมูลการรับสินค้า
     */
    @PutMapping("/{id}")
    public ResponseEntity<InboundLog> updateInboundLog(@PathVariable Long id, @RequestBody InboundLog inboundLog) {
        try {
            InboundLog updatedInboundLog = inboundLogService.updateInboundLog(id, inboundLog);
            return ResponseEntity.ok(updatedInboundLog);
        } catch (Exception e) {
            logger.severe("เกิดข้อผิดพลาดในการอัปเดตบันทึกการรับสินค้า: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * ลบบันทึกการรับสินค้า
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInboundLog(@PathVariable Long id) {
        try {
            logger.info("กำลังลบบันทึกการรับสินค้า ID: " + id);
            inboundLogService.deleteInboundLog(id);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "ลบข้อมูลการรับสินค้าสำเร็จ");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("เกิดข้อผิดพลาดในการลบบันทึกการรับสินค้า: " + e.getMessage());

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");

            // ตรวจสอบข้อความข้อผิดพลาดเพื่อส่งข้อความที่เป็นมิตรกับผู้ใช้
            String errorMessage = e.getMessage();
            if (errorMessage.contains("สินค้านี้มีการส่งออกไปแล้ว")) {
                errorResponse.put("message", "สินค้านี้มีการส่งออกไปแล้ว ไม่สามารถลบข้อมูลการรับสินค้าได้");
            } else {
                errorResponse.put("message", "ไม่สามารถลบข้อมูลการรับสินค้าได้: " + errorMessage);
            }

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * ดึงข้อมูลการรับสินค้าล่าสุด
     */
    @GetMapping("/recent")
    public ResponseEntity<List<InboundLog>> getRecentInboundLogs() {
        return ResponseEntity.ok(inboundLogService.getRecentInboundLogs());
    }

    /**
     * ดึงข้อมูลการรับสินค้าตามช่วงวันที่
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<InboundLog>> getInboundLogsByDateRange(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        return ResponseEntity.ok(inboundLogService.getInboundLogsByDateRange(start, end));
    }

    /**
     * ดึงข้อมูลการรับสินค้าตามชื่อผู้จัดส่ง
     */
    @GetMapping("/supplier")
    public ResponseEntity<List<InboundLog>> getInboundLogsBySupplier(@RequestParam String supplierName) {
        return ResponseEntity.ok(inboundLogService.getInboundLogsBySupplier(supplierName));
    }
}
