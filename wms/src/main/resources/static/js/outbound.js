// JavaScript สำหรับการจัดการระบบส่งออกสินค้า
document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบเซสชันผู้ใช้
    checkSession(() => {
        // โหลดข้อมูลและตั้งค่า event listeners
        loadOutboundLogs();
        loadProductOptions();
        setupOutboundForms();

        // ตั้งค่าวันที่ส่งออกสินค้าเป็นวันที่ปัจจุบัน
        document.getElementById('outbound-date').value = formatDateForInput(new Date());
    });
});

// ตั้งค่า event listeners สำหรับฟอร์มต่างๆ
function setupOutboundForms() {
    const addOutboundForm = document.getElementById('add-outbound-form');
    if (addOutboundForm) {
        addOutboundForm.addEventListener('submit', handleAddOutbound);
    }

    const editOutboundForm = document.getElementById('edit-outbound-form');
    if (editOutboundForm) {
        editOutboundForm.addEventListener('submit', handleEditOutbound);
    }
}

// ฟังก์ชันการเลือกสินค้า
function handleProductSelect() {
    const selectElement = document.getElementById('product-select');
    const productDetailsDiv = document.getElementById('product-details');

    // เคลียร์ค่าข้อผิดพลาดถ้ามี
    clearErrorMessage('product-select-error');

    if (selectElement.value === '') {
        // ซ่อนรายละเอียดสินค้าถ้าไม่มีการเลือกสินค้า
        productDetailsDiv.style.display = 'none';
        return;
    }

    // แสดงรายละเอียดสินค้า
    productDetailsDiv.style.display = 'block';

    // ดึงข้อมูลสินค้าที่เลือก
    fetchAPI(`/api/products/${selectElement.value}`)
        .then(product => {
            document.getElementById('product-id').value = product.id;
            document.getElementById('product').value = product.name;
            document.getElementById('current-stock').value = product.quantity;
            document.getElementById('current-location').value = product.location || 'ไม่ระบุตำแหน่ง';
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

            // กรองเฉพาะสินค้าที่มีในคลัง (จำนวนมากกว่า 0)
            const availableProducts = products.filter(product => product.quantity > 0);

            // เพิ่มตัวเลือกสินค้า
            availableProducts.forEach(product => {
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

// โหลดข้อมูลการส่งออกสินค้าทั้งหมด
function loadOutboundLogs() {
    fetchAPI('/api/outbound')
        .then(outboundLogs => {
            renderOutboundTable(outboundLogs);
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการส่งออกสินค้า:', error);
        });
}

// แสดงข้อมูลการส่งออกสินค้าในตาราง
function renderOutboundTable(outboundLogs) {
    const tableBody = document.querySelector('#outbound-table tbody');
    tableBody.innerHTML = '';

    outboundLogs.forEach(outbound => {
        const row = document.createElement('tr');
        const formattedDate = formatDate(outbound.outboundDate);

        row.innerHTML = `
            <td>${outbound.product.name}</td>
            <td>${outbound.quantityExported}</td>
            <td>${outbound.customerName || '-'}</td>
            <td>${outbound.orderNumber || '-'}</td>
            <td>${formattedDate}</td>
            <td>${outbound.processedBy || '-'}</td>
            <td>${outbound.notes || '-'}</td>
            <td>
                <button class="btn" onclick="editOutbound(${outbound.id})">แก้ไข</button>
                <button class="btn btn-danger" onclick="deleteOutbound(${outbound.id})">ลบ</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ค้นหาประวัติการส่งออกสินค้า
function searchOutboundLogs() {
    const keyword = document.getElementById('search-keyword').value.trim();

    if (!keyword) {
        loadOutboundLogs();
        return;
    }

    fetchAPI(`/api/outbound/search?keyword=${encodeURIComponent(keyword)}`)
        .then(outboundLogs => {
            renderOutboundTable(outboundLogs);
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการค้นหาการส่งออกสินค้า:', error);
        });
}

// จัดการการส่งฟอร์มเพิ่มข้อมูลการส่งออกสินค้า
function handleAddOutbound(e) {
    e.preventDefault();

    // ตรวจสอบว่ามีการเลือกสินค้าหรือไม่
    const productId = document.getElementById('product-id').value;
    if (!productId) {
        showErrorMessage('product-select-error', 'กรุณาเลือกสินค้า');
        return;
    }

    // ตรวจสอบจำนวนที่ส่งออก
    const quantity = parseInt(document.getElementById('quantity').value);
    const currentStock = parseInt(document.getElementById('current-stock').value);

    if (!quantity || quantity <= 0) {
        showErrorMessage('quantity-error', 'กรุณาระบุจำนวนที่ส่งออกให้มากกว่า 0');
        return;
    }

    if (quantity > currentStock) {
        showErrorMessage('quantity-error', 'จำนวนที่ส่งออกต้องไม่เกินจำนวนคงเหลือ');
        return;
    }

    // ตั้งค่าวันที่ส่งออกสินค้า
    const outboundDateElement = document.getElementById('outbound-date');
    const outboundDate = outboundDateElement && outboundDateElement.value
        ? new Date(outboundDateElement.value).toISOString()
        : new Date().toISOString();

    // สร้างข้อมูลการส่งออกสินค้า
    const outboundData = {
        product: { id: productId },
        quantityExported: quantity,
        customerName: document.getElementById('customer').value || '',
        orderNumber: document.getElementById('order-number').value || '',
        outboundDate: outboundDate,
        processedBy: localStorage.getItem('username') || '',
        notes: document.getElementById('notes').value || ''
    };

    // ส่งข้อมูลไปยังเซิร์ฟเวอร์
    fetchAPI('/api/outbound', 'POST', outboundData)
        .then(data => {
            // รีเซ็ตฟอร์มและโหลดข้อมูลใหม่
            document.getElementById('add-outbound-form').reset();

            // ซ่อนรายละเอียดสินค้า
            document.getElementById('product-details').style.display = 'none';

            // โหลดข้อมูลใหม่
            loadOutboundLogs();
            loadProductOptions();

            // แสดงข้อความแจ้งเตือน
            alert('บันทึกการส่งออกสินค้าสำเร็จ');

            // ตั้งค่าวันที่ส่งออกสินค้าเป็นวันที่ปัจจุบันอีกครั้ง
            if (outboundDateElement) {
                outboundDateElement.value = formatDateForInput(new Date());
            }
        })
        .catch(error => {
            showErrorMessage('add-outbound-error', 'ไม่สามารถบันทึกการส่งออกสินค้าได้: ' + error.message);
        });
}

// เตรียมฟอร์มสำหรับแก้ไขข้อมูลการส่งออกสินค้า
function editOutbound(outboundId) {
    fetchAPI(`/api/outbound/${outboundId}`)
        .then(outbound => {
            populateEditOutboundForm(outbound);
            openModal('edit-outbound-modal');
        })
        .catch(error => {
            alert('ไม่สามารถโหลดข้อมูลการส่งออกสินค้าได้');
        });
}

// กรอกข้อมูลในฟอร์มแก้ไข
function populateEditOutboundForm(outbound) {
    document.getElementById('edit-outbound-id').value = outbound.id;
    document.getElementById('edit-product').value = outbound.product.name;
    document.getElementById('edit-quantity').value = outbound.quantityExported;
    document.getElementById('edit-customer').value = outbound.customerName || '';
    document.getElementById('edit-order-number').value = outbound.orderNumber || '';
    document.getElementById('edit-outbound-date').value = formatDateForInput(outbound.outboundDate);
    document.getElementById('edit-notes').value = outbound.notes || '';

    // เก็บค่าจำนวนเดิมไว้เปรียบเทียบเมื่อมีการแก้ไข
    document.getElementById('edit-outbound-form').setAttribute('data-original-quantity', outbound.quantityExported);
}

// จัดการการส่งฟอร์มแก้ไขข้อมูลการส่งออกสินค้า
function handleEditOutbound(e) {
    e.preventDefault();

    const outboundId = document.getElementById('edit-outbound-id').value;
    const originalQuantity = parseInt(e.target.getAttribute('data-original-quantity') || '0');
    const newQuantity = parseInt(document.getElementById('edit-quantity').value);

    // ตรวจสอบจำนวนที่แก้ไข
    if (!newQuantity || newQuantity <= 0) {
        showErrorMessage('edit-quantity-error', 'กรุณาระบุจำนวนที่ส่งออกให้มากกว่า 0');
        return;
    }

    // ถ้าจำนวนเพิ่มขึ้น ต้องตรวจสอบว่ามีสินค้าเพียงพอหรือไม่
    if (newQuantity > originalQuantity) {
        fetchAPI(`/api/outbound/${outboundId}`)
            .then(outbound => {
                return fetchAPI(`/api/products/${outbound.product.id}`);
            })
            .then(product => {
                const availableQuantity = product.quantity + originalQuantity;
                if (newQuantity > availableQuantity) {
                    throw new Error('จำนวนสินค้าไม่เพียงพอสำหรับการแก้ไข');
                }
                submitOutboundEdit(outboundId);
            })
            .catch(error => {
                showErrorMessage('edit-outbound-error', error.message);
            });
    } else {
        // ถ้าจำนวนเท่าเดิมหรือลดลง ดำเนินการแก้ไขได้เลย
        submitOutboundEdit(outboundId);
    }
}

// ส่งข้อมูลแก้ไขการส่งออกสินค้า
function submitOutboundEdit(outboundId) {
    const formData = {
        quantityExported: parseInt(document.getElementById('edit-quantity').value),
        customerName: document.getElementById('edit-customer').value || '',
        orderNumber: document.getElementById('edit-order-number').value || '',
        outboundDate: new Date(document.getElementById('edit-outbound-date').value).toISOString(),
        notes: document.getElementById('edit-notes').value || ''
    };

    fetchAPI(`/api/outbound/${outboundId}`, 'PUT', formData)
        .then(data => {
            closeEditModal();
            loadOutboundLogs();
            loadProductOptions(); // โหลดข้อมูลสินค้าใหม่เพื่ออัปเดตจำนวนคงเหลือ
            alert('แก้ไขข้อมูลการส่งออกสินค้าสำเร็จ');
        })
        .catch(error => {
            showErrorMessage('edit-outbound-error', 'ไม่สามารถแก้ไขข้อมูลการส่งออกสินค้าได้: ' + error.message);
        });
}

// ปิดหน้าต่าง modal แก้ไขข้อมูลการส่งออกสินค้า
function closeEditModal() {
    closeModal('edit-outbound-modal', 'edit-outbound-form', 'edit-outbound-error');
}

// ลบข้อมูลการส่งออกสินค้า
function deleteOutbound(outboundId) {
    confirmAction('คุณต้องการลบข้อมูลการส่งออกสินค้านี้หรือไม่?', () => {
        fetch(`/api/outbound/${outboundId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    // ถ้า response ไม่สำเร็จ (status code ไม่ใช่ 2xx)
                    return response.text().then(text => {
                        throw new Error(text || 'ไม่สามารถลบข้อมูลการส่งออกสินค้าได้');
                    });
                }
                // ถ้าลบสำเร็จ
                loadOutboundLogs();
                loadProductOptions(); // โหลดข้อมูลสินค้าใหม่เพื่ออัปเดตจำนวนคงเหลือ
                alert('ลบข้อมูลการส่งออกสินค้าสำเร็จ');
            })
            .catch(error => {
                console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
                alert(error.message || 'ไม่สามารถลบข้อมูลการส่งออกสินค้าได้');
            });
    });
}