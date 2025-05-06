package com.example.wms.service;

import com.example.wms.model.Transfer;
import com.example.wms.model.Product;
import com.example.wms.model.Location;
import com.example.wms.repository.TransferRepository;
import com.example.wms.repository.ProductRepository;
import com.example.wms.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * เซอร์วิสสำหรับการจัดการการโอนย้ายสินค้าระหว่างตำแหน่งในคลังสินค้า
 */
@Service
@RequiredArgsConstructor
public class TransferService {

    private static final Logger logger = Logger.getLogger(TransferService.class.getName());

    private final TransferRepository transferRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;

    /**
     * ดึงข้อมูลการโอนย้ายทั้งหมด
     */
    public List<Transfer> getAllTransfers() {
        return transferRepository.findAll();
    }

    /**
     * ดึงข้อมูลการโอนย้ายตาม ID
     */
    public Optional<Transfer> getTransferById(Long id) {
        return transferRepository.findById(id);
    }

    /**
     * ดึงข้อมูลการโอนย้ายล่าสุด
     */
    public List<Transfer> getRecentTransfers() {
        return transferRepository.findRecentTransfers();
    }

    /**
     * สร้างการโอนย้ายใหม่
     */
    @Transactional
    public Transfer createTransfer(Transfer transfer) {
        // ตรวจสอบและเตรียมข้อมูลสินค้า
        Product product = validateAndGetProduct(transfer);

        // ตรวจสอบตำแหน่งต้นทางและปลายทาง
        validateLocations(transfer, product);

        // ตั้งค่าวันที่
        if (transfer.getTransferDate() == null) {
            transfer.setTransferDate(LocalDateTime.now());
        }

        // บันทึกการโอนย้าย
        return transferRepository.save(transfer);
    }

    /**
     * ตรวจสอบและดึงข้อมูลสินค้า
     */
    private Product validateAndGetProduct(Transfer transfer) {
        // ตรวจสอบว่ามีการระบุ product หรือไม่
        if (transfer.getProduct() == null || transfer.getProduct().getId() == null) {
            throw new RuntimeException("ต้องระบุข้อมูลสินค้า");
        }

        // ค้นหาข้อมูลสินค้าจากฐานข้อมูล
        Product product = productRepository.findById(transfer.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("ไม่พบสินค้าที่ระบุ"));

        // ตรวจสอบว่ามีจำนวนเพียงพอหรือไม่
        if (product.getQuantity() < transfer.getQuantityTransferred()) {
            throw new RuntimeException("จำนวนสินค้าไม่เพียงพอสำหรับการโอนย้าย");
        }

        return product;
    }

    /**
     * ตรวจสอบตำแหน่งต้นทางและปลายทาง
     */
    private void validateLocations(Transfer transfer, Product product) {
        // ตรวจสอบตำแหน่งต้นทาง
        String fromLocation = transfer.getFromLocation();
        if (!fromLocation.equals(product.getLocation())) {
            throw new RuntimeException("ตำแหน่งต้นทางไม่ตรงกับตำแหน่งปัจจุบันของสินค้า");
        }

        // ตรวจสอบตำแหน่งปลายทาง
        String toLocation = transfer.getToLocation();
        // ค้นหาข้อมูลตำแหน่งปลายทาง (อาจไม่มีในฐานข้อมูลถ้าเป็นการระบุเอง)
        List<Location> toLocations = locationRepository.findByNameContaining(toLocation);
        if (!toLocations.isEmpty()) {
            Location targetLocation = toLocations.get(0);

            // ตรวจสอบสถานะตำแหน่ง
            if (!"พร้อมใช้งาน".equals(targetLocation.getStatus())) {
                throw new RuntimeException("ตำแหน่งปลายทางไม่พร้อมใช้งาน");
            }

            // คำนวณการใช้งานพื้นที่ปัจจุบันจากข้อมูลสินค้าทั้งหมดที่อยู่ในตำแหน่งนั้น
            List<Product> productsInLocation = productRepository.findByLocation(toLocation);
            int currentUtilization = productsInLocation.stream()
                    .mapToInt(Product::getQuantity)
                    .sum();

            // ตรวจสอบความจุ
            if (currentUtilization + transfer.getQuantityTransferred() > targetLocation.getCapacity()) {
                throw new RuntimeException("ตำแหน่งปลายทางมีพื้นที่ไม่เพียงพอ");
            }
        }
    }

    /**
     * อัปเดตการโอนย้าย
     */
    @Transactional
    public Transfer updateTransfer(Long id, Transfer updatedTransfer) {
        Transfer existingTransfer = getTransferOrThrow(id);

        // อัปเดตข้อมูล (อนุญาตให้แก้ไขจำนวนและหมายเหตุ)
        if (updatedTransfer.getQuantityTransferred() > 0) {
            existingTransfer.setQuantityTransferred(updatedTransfer.getQuantityTransferred());
        }
        existingTransfer.setNotes(updatedTransfer.getNotes());

        // บันทึกการเปลี่ยนแปลง
        return transferRepository.save(existingTransfer);
    }

    /**
     * อัปเดตเฉพาะจำนวนและหมายเหตุของการโอนย้าย
     */
    @Transactional
    public Transfer updateTransferQuantity(Long id, Integer quantity, String notes) {
        Transfer existingTransfer = getTransferOrThrow(id);

        // เก็บค่าเดิมไว้เพื่อคำนวณความแตกต่าง
        int oldQuantity = existingTransfer.getQuantityTransferred();

        // ตรวจสอบจำนวนที่โอนย้าย
        if (quantity != null && quantity > 0) {
            existingTransfer.setQuantityTransferred(quantity);
        } else {
            // ถ้าไม่มีการเปลี่ยนแปลงจำนวน ให้ใช้ค่าเดิม
            quantity = oldQuantity;
        }

        // อัปเดตหมายเหตุ
        existingTransfer.setNotes(notes);

        // คำนวณความแตกต่างของจำนวนที่โอนย้าย
        int quantityDifference = quantity - oldQuantity;

        // ถ้ามีการเปลี่ยนแปลงจำนวน ให้อัปเดตข้อมูลสินค้าและตำแหน่งจัดเก็บ
        if (quantityDifference != 0) {
            updateProductQuantities(existingTransfer, quantityDifference);
        }

        // บันทึกการเปลี่ยนแปลงการโอนย้าย
        return transferRepository.save(existingTransfer);
    }

    /**
     * อัปเดตจำนวนสินค้าที่ต้นทางและปลายทาง
     */
    private void updateProductQuantities(Transfer transfer, int quantityDifference) {
        // ดึงข้อมูลสินค้าที่เกี่ยวข้อง
        Product productAtSource = findProductByNameAndLocation(
                transfer.getProduct().getName(),
                transfer.getFromLocation()
        );

        Product productAtDestination = findProductByNameAndLocation(
                transfer.getProduct().getName(),
                transfer.getToLocation()
        );

        // อัปเดตจำนวนสินค้าที่ตำแหน่งต้นทาง (ถ้ามี)
        if (productAtSource != null) {
            // ถ้าเพิ่มจำนวนโอนย้าย ให้ลดจำนวนที่ต้นทาง
            if (quantityDifference > 0) {
                productAtSource.setQuantity(productAtSource.getQuantity() - quantityDifference);
            }
            // ถ้าลดจำนวนโอนย้าย ให้เพิ่มจำนวนที่ต้นทาง
            else {
                productAtSource.setQuantity(productAtSource.getQuantity() + Math.abs(quantityDifference));
            }

            // บันทึกการเปลี่ยนแปลง
            productRepository.save(productAtSource);
        }

        // อัปเดตจำนวนสินค้าที่ตำแหน่งปลายทาง (ถ้ามี)
        if (productAtDestination != null) {
            // ถ้าเพิ่มจำนวนโอนย้าย ให้เพิ่มจำนวนที่ปลายทาง
            if (quantityDifference > 0) {
                productAtDestination.setQuantity(productAtDestination.getQuantity() + quantityDifference);
            }
            // ถ้าลดจำนวนโอนย้าย ให้ลดจำนวนที่ปลายทาง
            else {
                productAtDestination.setQuantity(productAtDestination.getQuantity() - Math.abs(quantityDifference));
            }

            // บันทึกการเปลี่ยนแปลง
            productRepository.save(productAtDestination);
        }
    }

    /**
     * ค้นหาสินค้าตามชื่อและตำแหน่ง
     */
    private Product findProductByNameAndLocation(String productName, String location) {
        List<Product> products = productRepository.findByLocation(location);
        return products.stream()
                .filter(p -> p.getName().equals(productName))
                .findFirst()
                .orElse(null);
    }

    /**
     * ดำเนินการโอนย้าย (เดิมคือยืนยันการโอนย้าย)
     */
    @Transactional
    public Transfer processTransfer(Long id) {
        Transfer transfer = getTransferOrThrow(id);

        // ดึงข้อมูลสินค้า
        Product product = productRepository.findById(transfer.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("ไม่พบสินค้าที่ระบุ"));

        int transferQuantity = transfer.getQuantityTransferred();

        // ตรวจสอบหากมีสินค้าในตำแหน่งปลายทางอยู่แล้ว
        Product productAtDestination = findProductByNameAndLocation(
                product.getName(),
                transfer.getToLocation()
        );

        if (productAtDestination != null) {
            // ถ้ามีสินค้าชนิดเดียวกันอยู่ที่ปลายทางแล้ว เพิ่มจำนวนสินค้า
            productAtDestination.setQuantity(productAtDestination.getQuantity() + transferQuantity);
            productRepository.save(productAtDestination);
        } else {
            // ถ้าไม่มีสินค้าชนิดเดียวกันที่ปลายทาง ให้สร้างสินค้าใหม่
            Product newProduct = new Product(product.getName(), product.getMinimumStock());
            newProduct.setDescription(product.getDescription());
            newProduct.setQuantity(transferQuantity);
            newProduct.setLocation(transfer.getToLocation());
            productRepository.save(newProduct);
        }

        // ลดจำนวนสินค้าที่ต้นทาง
        product.setQuantity(product.getQuantity() - transferQuantity);

        // หากสินค้าหมด ให้เปลี่ยนตำแหน่งเป็นค่าว่าง
        if (product.getQuantity() == 0) {
            product.setLocation(null);
        }

        productRepository.save(product);

        return transferRepository.save(transfer);
    }

    /**
     * ดึงข้อมูลการโอนย้ายหรือส่ง Exception ถ้าไม่พบ
     */
    private Transfer getTransferOrThrow(Long id) {
        return transferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการโอนย้ายที่ระบุ ID: " + id));
    }

    /**
     * ลบการโอนย้าย
     */
    @Transactional
    public void deleteTransfer(Long id) {
        Transfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการโอนย้ายที่ระบุ ID: " + id));

        // ย้อนกลับการโอนย้ายสินค้า โดยย้ายสินค้ากลับจากตำแหน่งปลายทางไปยังตำแหน่งต้นทาง
        revertTransferredProducts(transfer);

        // ลบข้อมูลการโอนย้าย
        transferRepository.deleteById(id);
    }

    /**
     * ย้อนกลับการโอนย้ายสินค้า
     */
    private void revertTransferredProducts(Transfer transfer) {
        int transferQuantity = transfer.getQuantityTransferred();

        try {
            // ค้นหาสินค้าที่ตำแหน่งปลายทางที่ถูกสร้างจากการโอนย้ายนี้
            Product productAtDestination = findProductByNameAndLocation(
                    transfer.getProduct().getName(),
                    transfer.getToLocation()
            );

            // ถ้าไม่พบสินค้าที่ตำแหน่งปลายทาง ไม่สามารถย้อนกลับได้
            if (productAtDestination == null) {
                throw new RuntimeException("ไม่พบสินค้าที่ตำแหน่งปลายทาง ไม่สามารถย้อนกลับการโอนย้ายได้");
            }

            // ตรวจสอบว่ามีจำนวนเพียงพอที่จะย้อนกลับหรือไม่
            if (productAtDestination.getQuantity() < transferQuantity) {
                throw new RuntimeException("จำนวนสินค้าที่ตำแหน่งปลายทางไม่เพียงพอที่จะย้อนกลับการโอนย้าย");
            }

            // ลดจำนวนสินค้าที่ตำแหน่งปลายทาง
            productAtDestination.setQuantity(productAtDestination.getQuantity() - transferQuantity);

            // ถ้าสินค้าที่ปลายทางหมดแล้ว (จำนวน = 0) ให้ลบออก
            if (productAtDestination.getQuantity() <= 0) {
                productRepository.delete(productAtDestination);
            } else {
                // บันทึกการเปลี่ยนแปลงสินค้าที่ตำแหน่งปลายทาง
                productRepository.save(productAtDestination);
            }

            // ค้นหาสินค้าที่ตำแหน่งต้นทาง
            Product productAtSource = findProductByNameAndLocation(
                    transfer.getProduct().getName(),
                    transfer.getFromLocation()
            );

            if (productAtSource != null) {
                // ถ้ามีสินค้าชนิดเดียวกันอยู่ที่ต้นทางแล้ว เพิ่มจำนวนสินค้า
                productAtSource.setQuantity(productAtSource.getQuantity() + transferQuantity);
                productRepository.save(productAtSource);
            } else {
                // ถ้าไม่มีสินค้าชนิดเดียวกันที่ต้นทาง ให้สร้างสินค้าใหม่
                Product originalProduct = transfer.getProduct();
                Product newProduct = new Product(originalProduct.getName(), originalProduct.getMinimumStock());
                newProduct.setDescription(originalProduct.getDescription());
                newProduct.setQuantity(transferQuantity);
                newProduct.setLocation(transfer.getFromLocation());
                productRepository.save(newProduct);
            }
        } catch (Exception e) {
            // บันทึกข้อผิดพลาดและโยนข้อผิดพลาดต่อ
            logger.severe("เกิดข้อผิดพลาดในการย้อนกลับการโอนย้ายสินค้า: " + e.getMessage());
            throw e;
        }
    }

    /**
     * ดึงข้อมูลการโอนย้ายตามชื่อสินค้า (ตรงกันทุกตัวอักษร)
     */
    public List<Transfer> getTransfersByProductName(String productName) {
        return transferRepository.findByProduct_Name(productName);
    }
}

