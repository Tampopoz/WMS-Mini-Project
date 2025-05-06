package com.example.wms.service;

import com.example.wms.model.InboundLog;
import com.example.wms.model.OutboundLog;
import com.example.wms.model.Product;
import com.example.wms.model.Transfer;
import com.example.wms.repository.InboundLogRepository;
import com.example.wms.repository.OutboundLogRepository;
import com.example.wms.repository.ProductRepository;
import com.example.wms.repository.TransferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * เซอร์วิสสำหรับการจัดการข้อมูลการรับสินค้า
 */
@Service
@RequiredArgsConstructor
public class InboundLogService {

    private static final Logger logger = Logger.getLogger(InboundLogService.class.getName());

    private final InboundLogRepository inboundLogRepository;
    private final ProductRepository productRepository;
    private final TransferRepository transferRepository;
    private final OutboundLogRepository outboundLogRepository;

    /**
     * ดึงข้อมูลการรับสินค้าทั้งหมด
     */
    public List<InboundLog> getAllInboundLogs() {
        return inboundLogRepository.findAll();
    }

    /**
     * ดึงข้อมูลการรับสินค้าตาม ID
     */
    public Optional<InboundLog> getInboundLogById(Long id) {
        return inboundLogRepository.findById(id);
    }

    /**
     * สร้างบันทึกการรับสินค้าใหม่
     */
    @Transactional
    public InboundLog createInboundLog(InboundLog inboundLog) {
        // ตรวจสอบและดึงข้อมูลสินค้า
        Product product = validateAndGetProduct(inboundLog);

        // ตั้งค่าวันที่รับสินค้าให้เป็นปัจจุบัน ถ้าไม่ได้กำหนดมา
        if (inboundLog.getReceivedDate() == null) {
            inboundLog.setReceivedDate(LocalDateTime.now());
        }

        // บันทึกการรับสินค้า
        InboundLog savedInboundLog = inboundLogRepository.save(inboundLog);

        // อัปเดตจำนวนสินค้าคงเหลือ
        updateProductStock(product, inboundLog.getQuantityReceived());

        return savedInboundLog;
    }

    /**
     * ตรวจสอบและดึงข้อมูลสินค้า
     */
    private Product validateAndGetProduct(InboundLog inboundLog) {
        if (inboundLog.getProduct() == null || inboundLog.getProduct().getId() == null) {
            throw new RuntimeException("ต้องระบุข้อมูลสินค้า");
        }

        return productRepository.findById(inboundLog.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("ไม่พบสินค้าที่ระบุ"));
    }

    /**
     * อัปเดตจำนวนสินค้าคงเหลือ
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void updateProductStock(Product product, int quantity) {
        product.setQuantity(product.getQuantity() + quantity);
        productRepository.save(product);
    }

    /**
     * อัปเดตข้อมูลการรับสินค้า
     */
    @Transactional
    public InboundLog updateInboundLog(Long id, InboundLog updatedInboundLog) {
        // ค้นหาข้อมูลการรับสินค้าที่ต้องการอัปเดต
        InboundLog existingInboundLog = getInboundLogOrThrow(id);

        // คำนวณความแตกต่างของจำนวนที่รับ
        int quantityDiff = updatedInboundLog.getQuantityReceived() - existingInboundLog.getQuantityReceived();

        // อัปเดตข้อมูลการรับสินค้า
        existingInboundLog.setQuantityReceived(updatedInboundLog.getQuantityReceived());
        existingInboundLog.setSupplierName(updatedInboundLog.getSupplierName());
        existingInboundLog.setReferenceNumber(updatedInboundLog.getReferenceNumber());
        existingInboundLog.setReceivedDate(updatedInboundLog.getReceivedDate());
        existingInboundLog.setReceivedBy(updatedInboundLog.getReceivedBy());

        // อัปเดตข้อมูลสินค้า
        Product product = existingInboundLog.getProduct();
        if (updatedInboundLog.getProduct() != null) {
            updateProductDetails(product, updatedInboundLog.getProduct());
            existingInboundLog.setProduct(product);
        }

        // บันทึกการเปลี่ยนแปลง
        InboundLog savedInboundLog = inboundLogRepository.save(existingInboundLog);

        // อัปเดตจำนวนสินค้าคงเหลือ ถ้ามีการเปลี่ยนแปลงจำนวนที่รับ
        if (quantityDiff != 0) {
            updateProductStock(product, quantityDiff);
        }

        return savedInboundLog;
    }

    /**
     * อัปเดตรายละเอียดสินค้า
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void updateProductDetails(Product currentProduct, Product updatedProduct) {
        // อัปเดตเฉพาะข้อมูลที่มีการเปลี่ยนแปลง
        if (updatedProduct.getName() != null && !updatedProduct.getName().isEmpty()) {
            currentProduct.setName(updatedProduct.getName());
        }

        if (updatedProduct.getDescription() != null) {
            currentProduct.setDescription(updatedProduct.getDescription());
        }

        if (updatedProduct.getLocation() != null) {
            currentProduct.setLocation(updatedProduct.getLocation());
        }

        if (updatedProduct.getMinimumStock() > 0) {
            currentProduct.setMinimumStock(updatedProduct.getMinimumStock());
        }

        // บันทึกการเปลี่ยนแปลงข้อมูลสินค้า
        productRepository.save(currentProduct);
    }

    /**
     * ตรวจสอบว่ามีการส่งออกสินค้าที่เกี่ยวข้องกับการรับสินค้านี้หรือไม่
     */
    private boolean hasRelatedOutboundLogs(Product product) {
        List<OutboundLog> outboundLogs = outboundLogRepository.findByProduct(product);
        return !outboundLogs.isEmpty();
    }

    /**
     * ลบบันทึกการรับสินค้า
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public void deleteInboundLog(Long id) {
        try {
            InboundLog inboundLog = getInboundLogOrThrow(id);
            Product product = inboundLog.getProduct();
            Long productId = product.getId();
            String productName = product.getName();

            logger.info("เริ่มลบบันทึกการรับสินค้า ID: " + id + " สำหรับสินค้า: " + productName);

            // ตรวจสอบว่ามีการส่งออกสินค้าที่เกี่ยวข้องหรือไม่
            if (hasRelatedOutboundLogs(product)) {
                logger.warning("พบข้อมูลการส่งออกสินค้าที่เกี่ยวข้องกับสินค้า ID: " + productId);
                throw new RuntimeException("ไม่สามารถลบข้อมูลการรับสินค้าได้: สินค้านี้มีการส่งออกไปแล้ว");
            }

            // ตรวจสอบว่ามีการอ้างอิงในตาราง transfers หรือไม่
            List<Transfer> relatedTransfers = transferRepository.findByProduct(product);

            if (relatedTransfers.isEmpty()) {
                // ถ้าไม่มีการอ้างอิงในตาราง transfers ให้ลบสินค้าและบันทึกการรับสินค้าทั้งหมดที่เกี่ยวข้อง
                logger.info("ไม่พบการอ้างอิงในตาราง transfers สำหรับสินค้า ID: " + productId + " จะทำการลบสินค้าและบันทึกการรับสินค้าทั้งหมด");

                // ลบบันทึกการรับสินค้าทั้งหมดที่เกี่ยวข้องกับสินค้านี้
                deleteAllInboundLogsForProduct(productId);

                // ลบสินค้า
                productRepository.deleteById(productId);
                logger.info("ลบสินค้า ID: " + productId + " ชื่อ: " + productName + " สำเร็จ");
            } else {
                // ถ้ามีการอ้างอิงในตาราง transfers ให้ลบบันทึกการรับสินค้าทั้งหมดและตั้งค่าจำนวนสินค้าเป็น 0
                logger.warning("พบการอ้างอิงในตาราง transfers จำนวน " + relatedTransfers.size() + " รายการ สำหรับสินค้า ID: " + productId);
                logger.info("จะทำการลบบันทึกการรับสินค้าทั้งหมดและตั้งค่าจำนวนสินค้าเป็น 0");

                // ลบบันทึกการรับสินค้าทั้งหมดที่เกี่ยวข้องกับสินค้านี้
                List<InboundLog> allLogs = inboundLogRepository.findByProductId(productId);

                for (InboundLog log : allLogs) {
                    inboundLogRepository.deleteById(log.getId());
                    logger.info("ลบบันทึกการรับสินค้า ID: " + log.getId() + " สำเร็จ");
                }

                // ตั้งค่าจำนวนสินค้าเป็น 0
                product.setQuantity(0);
                productRepository.save(product);
                logger.info("ตั้งค่าจำนวนสินค้า ID: " + productId + " เป็น 0 สำเร็จ");
            }

            logger.info("ลบบันทึกการรับสินค้าสำเร็จ");
        } catch (Exception e) {
            logger.severe("เกิดข้อผิดพลาดในการลบบันทึกการรับสินค้า: " + e.getMessage());
            throw new RuntimeException("ไม่สามารถลบข้อมูลการรับสินค้าได้: " + e.getMessage());
        }
    }

    /**
     * ลบบันทึกการรับสินค้าทั้งหมดของสินค้า
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public void deleteAllInboundLogsForProduct(Long productId) {
        try {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("ไม่พบสินค้าที่ระบุ ID: " + productId));

            logger.info("เริ่มลบบันทึกการรับสินค้าทั้งหมดสำหรับสินค้า ID: " + productId);

            // ตรวจสอบว่ามีการส่งออกสินค้าที่เกี่ยวข้องหรือไม่
            if (hasRelatedOutboundLogs(product)) {
                logger.warning("พบข้อมูลการส่งออกสินค้าที่เกี่ยวข้องกับสินค้า ID: " + productId);
                throw new RuntimeException("ไม่สามารถลบข้อมูลการรับสินค้าได้: สินค้านี้มีการส่งออกไปแล้ว");
            }

            // ลบบันทึกการรับสินค้าทั้งหมดที่เกี่ยวข้องกับสินค้านี้
            List<InboundLog> allLogs = inboundLogRepository.findByProductId(productId);

            if (allLogs.isEmpty()) {
                logger.info("ไม่พบบันทึกการรับสินค้าสำหรับสินค้า ID: " + productId);
                return;
            }

            logger.info("พบบันทึกการรับสินค้าจำนวน " + allLogs.size() + " รายการสำหรับสินค้า ID: " + productId);

            for (InboundLog log : allLogs) {
                inboundLogRepository.deleteById(log.getId());
                logger.info("ลบบันทึกการรับสินค้า ID: " + log.getId() + " สำเร็จ");
            }

            logger.info("ลบบันทึกการรับสินค้าทั้งหมดสำหรับสินค้า ID: " + productId + " สำเร็จ");
        } catch (Exception e) {
            logger.severe("เกิดข้อผิดพลาดในการลบบันทึกการรับสินค้าทั้งหมดของสินค้า: " + e.getMessage());
            throw new RuntimeException("ไม่สามารถลบข้อมูลการรับสินค้าทั้งหมดของสินค้าได้: " + e.getMessage());
        }
    }

    /**
     * ดึงข้อมูลการรับสินค้าล่าสุด
     */
    public List<InboundLog> getRecentInboundLogs() {
        return inboundLogRepository.findRecentInbounds();
    }

    /**
     * ดึงข้อมูลการรับสินค้าตามช่วงวันที่
     */
    public List<InboundLog> getInboundLogsByDateRange(LocalDateTime start, LocalDateTime end) {
        return inboundLogRepository.findByReceivedDateBetween(start, end);
    }

    /**
     * ดึงข้อมูลการรับสินค้าตามชื่อผู้จัดส่ง
     */
    public List<InboundLog> getInboundLogsBySupplier(String supplierName) {
        return inboundLogRepository.findBySupplierNameContaining(supplierName);
    }

    /**
     * ค้นหาข้อมูลการรับสินค้าตาม ID หรือส่ง Exception ถ้าไม่พบ
     */
    private InboundLog getInboundLogOrThrow(Long id) {
        return inboundLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการรับสินค้าที่ระบุ ID: " + id));
    }
}
