// JavaScript สำหรับการจัดการระบบโอนย้ายสินค้า
document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบเซสชันผู้ใช้
    checkSession(() => {
        // โหลดข้อมูลและตั้งค่า event listeners
        loadTransfers();
        loadProductOptions();
        loadLocationOptions();
        setupTransferForms();
    });
});

// ตั้งค่า event listeners สำหรับฟอร์มต่างๆ
function setupTransferForms() {
    const addTransferForm = document.getElementById('add-transfer-form');
    if (addTransferForm) {
        addTransferForm.addEventListener('submit', handleAddTransfer);
    }

    const editTransferForm = document.getElementById('edit-transfer-form');
    if (editTransferForm) {
        editTransferForm.addEventListener('submit', handleEditTransfer);
    }
}

// ฟังก์ชันการเลือกสินค้า
function handleProductSelect() {
    const selectElement = document.getElementById('product-select');
    const productId = selectElement.value;

    // เคลียร์ค่าข้อผิดพลาดถ้ามี
    clearErrorMessage('product-select-error');

    if (!productId) {
        // ล้างข้อมูลในฟอร์ม
        document.getElementById('product-id').value = '';
        document.getElementById('product').value = '';
        document.getElementById('current-stock').value = '';
        document.getElementById('from-location').value = '';
        return;
    }

    // ดึงข้อมูลสินค้าที่เลือก
    fetchAPI(`/api/products/${productId}`)
        .then(product => {
            // แสดงข้อมูลสินค้า
            document.getElementById('product-id').value = product.id;
            document.getElementById('product').value = product.name;
            document.getElementById('current-stock').value = product.quantity;
            document.getElementById('from-location').value = product.location || '';

            // ตรวจสอบว่ามีตำแหน่งปัจจุบันหรือไม่
            if (!product.location) {
                showErrorMessage('from-location-error', 'สินค้านี้ยังไม่มีตำแหน่งปัจจุบัน ไม่สามารถโอนย้ายได้');
            }
        })
        .catch(error => {
            showErrorMessage('product-select-error', 'ไม่สามารถโหลดข้อมูลสินค้าได้');
        });
}

// โหลดตัวเลือกสินค้าสำหรับเลือกในฟอร์ม
function loadProductOptions() {
    fetchAPI('/api/products')
        .then(products => {
            const productSelect = document.getElementById('product-select');

            // ล้างตัวเลือกเดิมยกเว้นตัวแรก
            productSelect.innerHTML = '<option value="">-- เลือกสินค้า --</option>';

            // กรองเฉพาะสินค้าที่มีตำแหน่งและจำนวนมากกว่า 0
            const transferableProducts = products.filter(product =>
                product.location && product.quantity > 0
            );

            // เพิ่มตัวเลือกสินค้า
            transferableProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (คงเหลือ: ${product.quantity} ที่: ${product.location || 'ไม่ระบุ'})`;
                productSelect.appendChild(option);
            });
        })
        .catch(error => {
            showErrorMessage('product-select-error', 'ไม่สามารถโหลดข้อมูลสินค้าได้');
        });
}

// โหลดตัวเลือกตำแหน่งสำหรับเลือกในฟอร์ม
function loadLocationOptions() {
    // ดึงข้อมูลสินค้าและตำแหน่งแบบขนาน
    Promise.all([
        fetchAPI('/api/products'),
        fetchAPI('/api/locations')
    ])
        .then(([products, locations]) => {
            // สร้าง Map ของตำแหน่งเพื่อง่ายต่อการค้นหา
            const locationMap = new Map();
            locations.forEach(location => {
                locationMap.set(location.name, location);
                // รีเซ็ตค่าการใช้งานเป็น 0 ก่อน
                location.currentUtilization = 0;
            });

            // คำนวณการใช้งานจากข้อมูลสินค้า
            products.forEach(product => {
                if (product.location && locationMap.has(product.location)) {
                    const location = locationMap.get(product.location);
                    location.currentUtilization += product.quantity;
                }
            });

            // คำนวณค่า availableCapacity
            locations.forEach(location => {
                location.availableCapacity = Math.max(0, location.capacity - location.currentUtilization);
                location.available = location.availableCapacity > 0 && location.status === 'พร้อมใช้งาน';
            });

            const locationSelect = document.getElementById('to-location');

            // ล้างตัวเลือกเดิมยกเว้นตัวแรก
            locationSelect.innerHTML = '<option value="">-- เลือกตำแหน่งปลายทาง --</option>';

            // กรองเฉพาะตำแหน่งที่พร้อมใช้งานและมีพื้นที่ว่าง
            const availableLocations = locations.filter(location =>
                location.status === 'พร้อมใช้งาน' && location.availableCapacity > 0
            );

            // เพิ่มตัวเลือกตำแหน่ง
            availableLocations.forEach(location => {
                const option = document.createElement('option');
                option.value = location.name;
                option.textContent = `${location.name} (ว่าง: ${location.availableCapacity})`;
                locationSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลตำแหน่งจัดเก็บ:', error);
        });
}

// โหลดข้อมูลการโอนย้ายทั้งหมด
function loadTransfers() {
    fetchAPI('/api/transfers')
        .then(transfers => {
            renderTransfersTable(transfers);
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการโอนย้าย:', error);
        });
}

// แสดงข้อมูลการโอนย้ายในตาราง
function renderTransfersTable(transfers) {
    const tableBody = document.querySelector('#transfers-table tbody');
    tableBody.innerHTML = '';

    transfers.forEach(transfer => {
        const row = document.createElement('tr');
        const formattedDate = formatDate(transfer.transferDate);

        row.innerHTML = `
            <td>${transfer.product.name}</td>
            <td>${transfer.quantityTransferred}</td>
            <td>${transfer.fromLocation}</td>
            <td>${transfer.toLocation}</td>
            <td>${formattedDate}</td>
            <td>${transfer.transferBy || '-'}</td>
            <td>${transfer.notes || '-'}</td>
            <td class="actions">
                <button class="btn" onclick="editTransfer(${transfer.id})">แก้ไข</button>
                <button class="btn btn-danger" onclick="deleteTransfer(${transfer.id})">ลบ</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ค้นหาการโอนย้าย
function searchTransfers() {
    const keyword = document.getElementById('search-keyword').value.trim();

    if (!keyword) {
        loadTransfers();
        return;
    }

    // ค้นหาการโอนย้ายตามชื่อสินค้า
    fetchAPI(`/api/transfers/search/product?productName=${encodeURIComponent(keyword)}`)
        .then(transfers => {
            renderTransfersTable(transfers);
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการค้นหาการโอนย้าย:', error);
        });
}

// จัดการการส่งฟอร์มเพิ่มการโอนย้าย
function handleAddTransfer(e) {
    e.preventDefault();

    // ตรวจสอบการกรอกข้อมูล
    const productId = document.getElementById('product-id').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const fromLocation = document.getElementById('from-location').value;
    const toLocation = document.getElementById('to-location').value;
    const currentStock = parseInt(document.getElementById('current-stock').value);

    // ตรวจสอบสินค้า
    if (!productId) {
        showErrorMessage('product-select-error', 'กรุณาเลือกสินค้า');
        return;
    }

    // ตรวจสอบตำแหน่งต้นทาง
    if (!fromLocation) {
        showErrorMessage('from-location-error', 'สินค้านี้ยังไม่มีตำแหน่งปัจจุบัน ไม่สามารถโอนย้ายได้');
        return;
    }

    // ตรวจสอบตำแหน่งปลายทาง
    if (!toLocation) {
        showErrorMessage('to-location-error', 'กรุณาเลือกตำแหน่งปลายทาง');
        return;
    }

    // ตรวจสอบจำนวนที่โอนย้าย
    if (!quantity || quantity <= 0) {
        showErrorMessage('quantity-error', 'กรุณาระบุจำนวนที่โอนย้ายให้มากกว่า 0');
        return;
    }

    // ตรวจสอบว่าจำนวนที่โอนย้ายไม่เกินจำนวนคงเหลือ
    if (quantity > currentStock) {
        showErrorMessage('quantity-error', 'จำนวนที่โอนย้ายต้องไม่เกินจำนวนคงเหลือ');
        return;
    }

    // ตรวจสอบว่าตำแหน่งต้นทางและปลายทางไม่เหมือนกัน
    if (fromLocation === toLocation) {
        showErrorMessage('to-location-error', 'ตำแหน่งต้นทางและปลายทางต้องไม่เหมือนกัน');
        return;
    }

    // สร้างข้อมูลการโอนย้าย
    const transferData = {
        product: { id: productId },
        fromLocation: fromLocation,
        toLocation: toLocation,
        quantityTransferred: quantity,
        transferDate: new Date().toISOString(),
        transferBy: localStorage.getItem('username') || '',
        notes: document.getElementById('notes').value || ''
    };

    // สร้างและดำเนินการโอนย้ายในทันที
    Promise.all([
        fetchAPI('/api/transfers', 'POST', transferData),
        fetchAPI(`/api/products/${productId}`)
    ])
        .then(([transfer, product]) => {
            return fetchAPI(`/api/transfers/${transfer.id}/process`, 'POST');
        })
        .then(data => {
            // รีเซ็ตฟอร์มและโหลดข้อมูลใหม่
            document.getElementById('add-transfer-form').reset();
            loadTransfers();
            loadProductOptions();
            loadLocationOptions();
            alert('ทำรายการโอนย้ายสินค้าสำเร็จ');
        })
        .catch(error => {
            showErrorMessage('add-transfer-error', 'ไม่สามารถทำรายการโอนย้ายสินค้าได้: ' + error.message);
        });
}

// เตรียมฟอร์มสำหรับแก้ไขการโอนย้าย
function editTransfer(transferId) {
    fetchAPI(`/api/transfers/${transferId}`)
        .then(transfer => {
            populateEditTransferForm(transfer);
            openModal('edit-transfer-modal');
        })
        .catch(error => {
            alert('ไม่สามารถโหลดข้อมูลการโอนย้ายได้');
        });
}

// กรอกข้อมูลในฟอร์มแก้ไข
function populateEditTransferForm(transfer) {
    document.getElementById('edit-transfer-id').value = transfer.id;
    document.getElementById('edit-product').value = transfer.product.name;
    document.getElementById('edit-quantity').value = transfer.quantityTransferred;
    document.getElementById('edit-from-location').value = transfer.fromLocation;
    document.getElementById('edit-to-location').value = transfer.toLocation;
    document.getElementById('edit-notes').value = transfer.notes || '';
}

// จัดการการส่งฟอร์มแก้ไขการโอนย้าย
function handleEditTransfer(e) {
    e.preventDefault();

    const transferId = document.getElementById('edit-transfer-id').value;
    const quantity = parseInt(document.getElementById('edit-quantity').value);

    // ตรวจสอบจำนวนที่โอนย้าย
    if (!quantity || quantity <= 0) {
        showErrorMessage('edit-quantity-error', 'กรุณาระบุจำนวนที่โอนย้ายให้มากกว่า 0');
        return;
    }

    // สร้างข้อมูลจากฟอร์มเฉพาะส่วนที่ต้องการแก้ไข
    const formData = {
        quantityTransferred: quantity,
        notes: document.getElementById('edit-notes').value || ''
    };

    // ส่งคำขอแก้ไข
    fetchAPI(`/api/transfers/${transferId}/update-quantity`, 'POST', formData)
        .then(data => {
            closeEditModal();
            loadTransfers();
            alert('แก้ไขข้อมูลการโอนย้ายสำเร็จ');
        })
        .catch(error => {
            showErrorMessage('edit-transfer-error', 'ไม่สามารถแก้ไขข้อมูลการโอนย้ายได้: ' + error.message);
        });
}

// ลบการโอนย้าย
function deleteTransfer(transferId) {
    confirmAction('คุณต้องการลบข้อมูลการโอนย้ายนี้หรือไม่?', () => {
        fetch(`/api/transfers/${transferId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                // ตรวจสอบว่า response เป็น ok หรือไม่ โดยไม่พยายามแปลงเป็น JSON
                if (response.ok) {
                    // รีเฟรชข้อมูลสินค้าและการโอนย้าย
                    Promise.all([
                        fetchAPI('/api/products'),
                        fetchAPI('/api/transfers')
                    ])
                        .then(([products, transfers]) => {
                            // อัพเดทตารางการโอนย้าย
                            renderTransfersTable(transfers);
                            alert('ลบข้อมูลการโอนย้ายสำเร็จ');
                        })
                        .catch(err => {
                            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลหลังการลบ:', err);
                            // รีเฟรชหน้าเพื่อให้แน่ใจว่าข้อมูลถูกต้อง
                            window.location.reload();
                        });
                    return;
                }

                // ถ้า response ไม่ ok ให้พยายามอ่านข้อความผิดพลาด
                return response.text().then(text => {
                    // ถ้ามีข้อความผิดพลาด ให้พยายามแปลงเป็น JSON
                    try {
                        const errorData = JSON.parse(text);
                        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการลบข้อมูลการโอนย้าย');
                    } catch (e) {
                        // ถ้าแปลงเป็น JSON ไม่ได้ ให้ใช้ข้อความที่ได้มา
                        throw new Error(text || 'เกิดข้อผิดพลาดในการลบข้อมูลการโอนย้าย');
                    }
                });
            })
            .catch(error => {
                console.error('เกิดข้อผิดพลาดในการลบข้อมูลการโอนย้าย:', error);

                // ตรวจสอบว่าเป็นข้อผิดพลาดที่เกี่ยวกับการไม่พบข้อมูลหรือไม่
                if (error.message && (
                    error.message.includes('ไม่พบข้อมูล') ||
                    error.message.includes('not found') ||
                    error.message.includes('No value present')
                )) {
                    // ถ้าเป็นข้อผิดพลาดเกี่ยวกับการไม่พบข้อมูล แสดงว่าอาจถูกลบไปแล้ว
                    loadTransfers(); // โหลดข้อมูลใหม่เพื่อตรวจสอบ
                    alert('ข้อมูลการโอนย้ายถูกลบแล้ว');
                } else if (error.message && (
                    error.message.includes('ไม่พบสินค้าที่ตำแหน่งปลายทาง') ||
                    error.message.includes('จำนวนสินค้าที่ตำแหน่งปลายทางไม่เพียงพอ')
                )) {
                    // ข้อผิดพลาดเกี่ยวกับการย้อนกลับการโอนย้ายสินค้า
                    alert('ไม่สามารถลบรายการโอนย้ายได้: ' + error.message + '\nกรุณาตรวจสอบข้อมูลสินค้าที่ตำแหน่งปลายทาง');

                    // รีเฟรชหน้าเพื่อให้แน่ใจว่าข้อมูลถูกต้อง
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    // ข้อผิดพลาดอื่นๆ
                    alert('ไม่สามารถลบข้อมูลการโอนย้ายได้: ' + error.message);

                    // รีเฟรชหน้าเพื่อให้แน่ใจว่าข้อมูลถูกต้อง
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
            });
    });
}

// ปิดหน้าต่าง modal แก้ไขการโอนย้าย
function closeEditModal() {
    closeModal('edit-transfer-modal', 'edit-transfer-form', 'edit-transfer-error');
}