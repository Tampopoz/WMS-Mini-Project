package com.example.wms.controller;

import com.example.wms.model.Transfer;
import com.example.wms.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * คอนโทรลเลอร์สำหรับการจัดการการโอนย้ายสินค้า
 */
@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    /**
     * API สำหรับดึงข้อมูลการโอนย้ายทั้งหมด
     */
    @GetMapping
    public ResponseEntity<List<Transfer>> getAllTransfers() {
        List<Transfer> transfers = transferService.getAllTransfers();
        return ResponseEntity.ok(transfers);
    }

    /**
     * API สำหรับดึงข้อมูลการโอนย้ายตาม ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Transfer> getTransferById(@PathVariable Long id) {
        Transfer transfer = transferService.getTransferById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการโอนย้ายที่ระบุ ID: " + id));
        return ResponseEntity.ok(transfer);
    }

    /**
     * API สำหรับสร้างการโอนย้ายใหม่
     */
    @PostMapping
    public ResponseEntity<Transfer> createTransfer(@Valid @RequestBody Transfer transfer) {
        Transfer createdTransfer = transferService.createTransfer(transfer);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTransfer);
    }

    /**
     * API สำหรับอัปเดตข้อมูลการโอนย้าย
     */
    @PutMapping("/{id}")
    public ResponseEntity<Transfer> updateTransfer(
            @PathVariable Long id,
            @RequestBody Transfer transfer) {
        Transfer updatedTransfer = transferService.updateTransfer(id, transfer);
        return ResponseEntity.ok(updatedTransfer);
    }

    /**
     * API สำหรับอัปเดตเฉพาะจำนวนและหมายเหตุของการโอนย้าย
     */
    @PostMapping("/{id}/update-quantity")
    public ResponseEntity<Transfer> updateTransferQuantity(
            @PathVariable Long id,
            @RequestBody Transfer transferUpdate) {
        Transfer updatedTransfer = transferService.updateTransferQuantity(id,
                transferUpdate.getQuantityTransferred(),
                transferUpdate.getNotes());
        return ResponseEntity.ok(updatedTransfer);
    }

    /**
     * API สำหรับดำเนินการโอนย้าย (เดิมคือยืนยันการโอนย้าย)
     */
    @PostMapping("/{id}/process")
    public ResponseEntity<Transfer> processTransfer(@PathVariable Long id) {
        Transfer processedTransfer = transferService.processTransfer(id);
        return ResponseEntity.ok(processedTransfer);
    }

    /**
     * API สำหรับลบข้อมูลการโอนย้าย
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransfer(@PathVariable Long id) {
        transferService.deleteTransfer(id);
        return ResponseEntity.ok().build();
    }

    /**
     * API สำหรับดึงข้อมูลการโอนย้ายล่าสุด
     */
    @GetMapping("/recent")
    public ResponseEntity<List<Transfer>> getRecentTransfers() {
        List<Transfer> transfers = transferService.getRecentTransfers();
        return ResponseEntity.ok(transfers);
    }

    /**
     * API สำหรับค้นหาการโอนย้ายตามชื่อสินค้า
     */
    @GetMapping("/search/product")
    public ResponseEntity<List<Transfer>> searchTransfersByProductName(@RequestParam String productName) {
        List<Transfer> transfers = transferService.getTransfersByProductName(productName);
        return ResponseEntity.ok(transfers);
    }
}
