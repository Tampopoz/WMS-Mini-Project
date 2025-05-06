package com.example.wms.service;

import com.example.wms.model.OutboundLog;
import com.example.wms.model.Product;
import com.example.wms.repository.OutboundLogRepository;
import com.example.wms.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * เซอร์วิสสำหรับการจัดการข้อมูลการส่งออกสินค้า
 */
@Service
@RequiredArgsConstructor
public class OutboundLogService {

    private static final Logger logger = Logger.getLogger(OutboundLogService.class.getName());

    private final OutboundLogRepository outboundLogRepository;
    private final ProductRepository productRepository;

    /**
     * ดึงข้อมูลการส่งออกสินค้าทั้งหมด
     */
    public List<OutboundLog> getAllOutboundLogs() {
        return outboundLogRepository.findAll();
    }

    /**
     * ดึงข้อมูลการส่งออกสินค้าตาม ID
     */
    public Optional<OutboundLog> getOutboundLogById(Long id) {
        return outboundLogRepository.findById(id);
    }

    /**
     * ดึงข้อมูลการส่งออกสินค้าล่าสุด
     */
    public List<OutboundLog> getRecentOutboundLogs() {
        return outboundLogRepository.findRecentOutbounds();
    }

    /**
     * ค้นหาข้อมูลการส่งออกสินค้าตามคำค้น
     */
    public List<OutboundLog> searchOutboundLogs(String keyword) {
        return outboundLogRepository.searchOutbounds(keyword);
    }

    /**
     * สร้างบันทึกการส่งออกสินค้าใหม่
     */
    @Transactional
    public OutboundLog createOutboundLog(OutboundLog outboundLog) {
        // ตรวจสอบข้อมูลนำเข้า
        validateOutboundLogInput(outboundLog);

        // ตรวจสอบและดึงข้อมูลสินค้า
        Product product = validateAndGetProduct(outboundLog);

        // ตรวจสอบจำนวนสินค้าคงเหลือ
        if (product.getQuantity() < outboundLog.getQuantityExported()) {
            throw new RuntimeException("จำนวนสินค้าคงเหลือไม่เพียงพอสำหรับการส่งออก");
        }

        // ตั้งค่าวันที่ส่งออกสินค้าให้เป็นปัจจุบัน ถ้าไม่ได้กำหนดมา
        if (outboundLog.getOutboundDate() == null) {
            outboundLog.setOutboundDate(LocalDateTime.now());
        }

        // บันทึกการส่งออกสินค้า
        OutboundLog savedOutboundLog = outboundLogRepository.save(outboundLog);

        // อัปเดตจำนวนสินค้าคงเหลือ (ลดจำนวน)
        updateProductStock(product, -outboundLog.getQuantityExported());

        return savedOutboundLog;
    }

    /**
     * ตรวจสอบความถูกต้องของข้อมูลการส่งออกสินค้า
     */
    private void validateOutboundLogInput(OutboundLog outboundLog) {
        if (outboundLog.getQuantityExported() <= 0) {
            throw new RuntimeException("จำนวนสินค้าที่ส่งออกต้องมากกว่า 0");
        }

        if (outboundLog.getCustomerName() == null || outboundLog.getCustomerName().trim().isEmpty()) {
            throw new RuntimeException("ต้องระบุชื่อลูกค้า");
        }
    }

    /**
     * ตรวจสอบและดึงข้อมูลสินค้า
     */
    private Product validateAndGetProduct(OutboundLog outboundLog) {
        if (outboundLog.getProduct() == null || outboundLog.getProduct().getId() == null) {
            throw new RuntimeException("ต้องระบุข้อมูลสินค้า");
        }

        return productRepository.findById(outboundLog.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("ไม่พบสินค้าที่ระบุ"));
    }

    /**
     * อัปเดตจำนวนสินค้าคงเหลือ (เพิ่ม/ลด)
     */
    private void updateProductStock(Product product, int quantityChange) {
        product.setQuantity(product.getQuantity() + quantityChange);
        productRepository.save(product);
    }

    /**
     * อัปเดตข้อมูลการส่งออกสินค้า
     */
    @Transactional
    public OutboundLog updateOutboundLog(Long id, OutboundLog updatedOutboundLog) {
        // ค้นหาข้อมูลการส่งออกสินค้าที่ต้องการอัปเดต
        OutboundLog existingOutboundLog = getOutboundLogOrThrow(id);
        Product product = existingOutboundLog.getProduct();

        // คำนวณความแตกต่างของจำนวนที่ส่งออก
        int quantityDiff = 0;
        if (updatedOutboundLog.getQuantityExported() > 0) {
            quantityDiff = updatedOutboundLog.getQuantityExported() - existingOutboundLog.getQuantityExported();

            // ถ้าจำนวนเพิ่มขึ้น ต้องตรวจสอบว่ามีจำนวนคงเหลือเพียงพอหรือไม่
            if (quantityDiff > 0 && product.getQuantity() < quantityDiff) {
                throw new RuntimeException("จำนวนสินค้าคงเหลือไม่เพียงพอสำหรับการเพิ่มจำนวนส่งออก");
            }

            existingOutboundLog.setQuantityExported(updatedOutboundLog.getQuantityExported());
        }

        // อัปเดตข้อมูลการส่งออกสินค้าเฉพาะฟิลด์ที่มีการเปลี่ยนแปลง
        if (updatedOutboundLog.getCustomerName() != null && !updatedOutboundLog.getCustomerName().isEmpty()) {
            existingOutboundLog.setCustomerName(updatedOutboundLog.getCustomerName());
        }

        if (updatedOutboundLog.getOrderNumber() != null && !updatedOutboundLog.getOrderNumber().isEmpty()) {
            existingOutboundLog.setOrderNumber(updatedOutboundLog.getOrderNumber());
        }

        if (updatedOutboundLog.getOutboundDate() != null) {
            existingOutboundLog.setOutboundDate(updatedOutboundLog.getOutboundDate());
        }

        if (updatedOutboundLog.getNotes() != null) {
            existingOutboundLog.setNotes(updatedOutboundLog.getNotes());
        }

        // บันทึกการเปลี่ยนแปลง
        OutboundLog savedOutboundLog = outboundLogRepository.save(existingOutboundLog);

        // อัปเดตจำนวนสินค้าคงเหลือ ถ้ามีการเปลี่ยนแปลงจำนวนที่ส่งออก
        if (quantityDiff != 0) {
            updateProductStock(product, -quantityDiff);
        }

        return savedOutboundLog;
    }

    /**
     * ลบบันทึกการส่งออกสินค้า
     */
    @Transactional
    public void deleteOutboundLog(Long id) {
        OutboundLog outboundLog = getOutboundLogOrThrow(id);

        try {
            // เพิ่มจำนวนสินค้าคงเหลือกลับคืน
            Product product = outboundLog.getProduct();
            updateProductStock(product, outboundLog.getQuantityExported());

            // ลบข้อมูลการส่งออกสินค้า
            outboundLogRepository.deleteById(id);

            logger.info("ลบบันทึกการส่งออกสินค้า ID: " + id + " สำเร็จ");
        } catch (Exception e) {
            logger.severe("เกิดข้อผิดพลาดในการลบบันทึกการส่งออกสินค้า: " + e.getMessage());
            throw e;
        }
    }

    /**
     * ดึงข้อมูลการส่งออกสินค้าตามช่วงวันที่
     */
    public List<OutboundLog> getOutboundLogsByDateRange(LocalDateTime start, LocalDateTime end) {
        return outboundLogRepository.findByOutboundDateBetween(start, end);
    }

    /**
     * ดึงข้อมูลการส่งออกสินค้าตามชื่อลูกค้า
     */
    public List<OutboundLog> getOutboundLogsByCustomer(String customerName) {
        return outboundLogRepository.findByCustomerNameContaining(customerName);
    }

    /**
     * ค้นหาข้อมูลการส่งออกสินค้าตาม ID หรือส่ง Exception ถ้าไม่พบ
     */
    private OutboundLog getOutboundLogOrThrow(Long id) {
        return outboundLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการส่งออกสินค้าที่ระบุ ID: " + id));
    }
}
