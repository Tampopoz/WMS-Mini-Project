package com.example.wms.service;

import com.example.wms.model.Product;
import com.example.wms.model.InboundLog;
import com.example.wms.repository.ProductRepository;
import com.example.wms.repository.InboundLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final InboundLogRepository inboundLogRepository;

    /**
     * ดึงข้อมูลสินค้าทั้งหมด
     */
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    /**
     * ดึงข้อมูลสินค้าตาม ID
     */
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    /**
     * สร้างสินค้าใหม่
     */
    @Transactional
    public Product createProduct(Product product) {
        // ตรวจสอบข้อมูลนำเข้า
        validateProductInput(product);

        return productRepository.save(product);
    }

    /**
     * ตรวจสอบความถูกต้องของข้อมูลสินค้า
     */
    private void validateProductInput(Product product) {
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            throw new RuntimeException("ต้องระบุชื่อสินค้า");
        }

        if (product.getMinimumStock() < 0) {
            throw new RuntimeException("จำนวนสินค้าขั้นต่ำต้องไม่น้อยกว่า 0");
        }
    }

    /**
     * อัปเดตข้อมูลสินค้าและข้อมูลที่เกี่ยวข้องในบันทึกการรับสินค้า
     */
    @Transactional
    public Product updateProduct(Long id, Product product) {
        // ตรวจสอบการมีอยู่ของสินค้า
        Product existingProduct = getProductOrThrow(id);

        // อัปเดตเฉพาะฟิลด์ที่มีการเปลี่ยนแปลง
        if (product.getName() != null && !product.getName().isEmpty()) {
            existingProduct.setName(product.getName());
        }

        if (product.getDescription() != null) {
            existingProduct.setDescription(product.getDescription());
        }

        if (product.getLocation() != null) {
            existingProduct.setLocation(product.getLocation());
        }

        if (product.getMinimumStock() >= 0) {
            existingProduct.setMinimumStock(product.getMinimumStock());
        }

        if (product.getQuantity() >= 0) {
            existingProduct.setQuantity(product.getQuantity());
        }

        // บันทึกการเปลี่ยนแปลง
        Product updatedProduct = productRepository.save(existingProduct);

        // อัปเดตข้อมูลสินค้าในบันทึกการรับสินค้าทั้งหมดที่เกี่ยวข้อง
        updateRelatedInboundLogs(id, updatedProduct);

        return updatedProduct;
    }

    /**
     * อัปเดตข้อมูลสินค้าในบันทึกการรับสินค้าที่เกี่ยวข้อง
     */
    private void updateRelatedInboundLogs(Long productId, Product updatedProduct) {
        List<InboundLog> relatedInboundLogs = inboundLogRepository.findByProductId(productId);

        if (!relatedInboundLogs.isEmpty()) {
            for (InboundLog inboundLog : relatedInboundLogs) {
                inboundLog.setProduct(updatedProduct);
            }

            // บันทึกการเปลี่ยนแปลงทั้งหมดในครั้งเดียว
            inboundLogRepository.saveAll(relatedInboundLogs);
        }
    }

    /**
     * ลบสินค้าและข้อมูลที่เกี่ยวข้อง
     */
    @Transactional
    public void deleteProduct(Long id) {
        // ตรวจสอบการมีอยู่ของสินค้า
        getProductOrThrow(id);

        // ลบบันทึกการรับสินค้าที่เกี่ยวข้องกับสินค้านี้ก่อน
        List<InboundLog> relatedInboundLogs = inboundLogRepository.findByProductId(id);

        if (!relatedInboundLogs.isEmpty()) {
            inboundLogRepository.deleteAll(relatedInboundLogs);
        }

        // ลบสินค้า
        productRepository.deleteById(id);
    }

    /**
     * ดึงข้อมูลสินค้าที่มีจำนวนต่ำกว่าขั้นต่ำ
     */
    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    /**
     * ค้นหาสินค้าตามคำค้น
     */
    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContaining(keyword);
    }

    /**
     * ค้นหาสินค้าตาม ID หรือส่ง Exception ถ้าไม่พบ
     */
    private Product getProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบสินค้าที่ระบุ ID: " + id));
    }
}
