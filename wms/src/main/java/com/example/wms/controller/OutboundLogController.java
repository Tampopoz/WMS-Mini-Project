package com.example.wms.controller;

import com.example.wms.model.OutboundLog;
import com.example.wms.service.OutboundLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * คอนโทรลเลอร์สำหรับการจัดการ API เกี่ยวกับการส่งออกสินค้า
 */
@RestController
@RequestMapping("/api/outbound")
@RequiredArgsConstructor
public class OutboundLogController {

    private final OutboundLogService outboundLogService;

    /**
     * ดึงข้อมูลการส่งออกสินค้าทั้งหมด
     */
    @GetMapping
    public ResponseEntity<List<OutboundLog>> getAllOutboundLogs() {
        List<OutboundLog> outboundLogs = outboundLogService.getAllOutboundLogs();
        return ResponseEntity.ok(outboundLogs);
    }

    /**
     * ดึงข้อมูลการส่งออกสินค้าตาม ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<OutboundLog> getOutboundLogById(@PathVariable Long id) {
        try {
            OutboundLog outboundLog = outboundLogService.getOutboundLogById(id)
                    .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการส่งออกสินค้าที่ระบุ ID: " + id));
            return ResponseEntity.ok(outboundLog);
        } catch (RuntimeException e) {
            throw e; // จะถูกจัดการโดย GlobalExceptionHandler
        }
    }

    /**
     * สร้างบันทึกการส่งออกสินค้าใหม่
     */
    @PostMapping
    public ResponseEntity<OutboundLog> createOutboundLog(@Valid @RequestBody OutboundLog outboundLog) {
        OutboundLog createdOutboundLog = outboundLogService.createOutboundLog(outboundLog);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOutboundLog);
    }

    /**
     * อัปเดตข้อมูลการส่งออกสินค้า
     */
    @PutMapping("/{id}")
    public ResponseEntity<OutboundLog> updateOutboundLog(
            @PathVariable Long id,
            @Valid @RequestBody OutboundLog outboundLog) {
        OutboundLog updatedOutboundLog = outboundLogService.updateOutboundLog(id, outboundLog);
        return ResponseEntity.ok(updatedOutboundLog);
    }

    /**
     * ลบข้อมูลการส่งออกสินค้า
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOutboundLog(@PathVariable Long id) {
        outboundLogService.deleteOutboundLog(id);
        return ResponseEntity.ok().build();
    }

    /**
     * ดึงข้อมูลการส่งออกสินค้าล่าสุด
     */
    @GetMapping("/recent")
    public ResponseEntity<List<OutboundLog>> getRecentOutboundLogs() {
        List<OutboundLog> outboundLogs = outboundLogService.getRecentOutboundLogs();
        return ResponseEntity.ok(outboundLogs);
    }

    /**
     * ค้นหาข้อมูลการส่งออกสินค้าตามคำค้น
     */
    @GetMapping("/search")
    public ResponseEntity<List<OutboundLog>> searchOutboundLogs(@RequestParam String keyword) {
        List<OutboundLog> outboundLogs = outboundLogService.searchOutboundLogs(keyword);
        return ResponseEntity.ok(outboundLogs);
    }

    /**
     * ดึงข้อมูลการส่งออกสินค้าตามช่วงวันที่
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<OutboundLog>> getOutboundLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<OutboundLog> outboundLogs = outboundLogService.getOutboundLogsByDateRange(start, end);
        return ResponseEntity.ok(outboundLogs);
    }

    /**
     * ดึงข้อมูลการส่งออกสินค้าตามชื่อลูกค้า
     */
    @GetMapping("/customer")
    public ResponseEntity<List<OutboundLog>> getOutboundLogsByCustomer(@RequestParam String name) {
        List<OutboundLog> outboundLogs = outboundLogService.getOutboundLogsByCustomer(name);
        return ResponseEntity.ok(outboundLogs);
    }
}