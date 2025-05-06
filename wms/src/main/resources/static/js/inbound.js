// JavaScript สำหรับการจัดการระบบรับสินค้าเข้าคลัง
document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบเซสชันผู้ใช้
    checkSession(() => {
        // โหลดข้อมูลและตั้งค่า event listeners
        loadInboundLogs();
        loadProductOptions();
        setupInboundForms();

        // ตั้งค่าวันที่รับสินค้าเป็นวันที่ปัจจุบัน
        document.getElementById('receivedDate').value = formatDateForInput(new Date());
    });
});

// ตั้งค่า event listeners สำหรับฟอร์มต่างๆ
function setupInboundForms() {
    const addInboundForm = document.getElementById('add-inbound-form');
    if (addInboundForm) {
        // ใช้ JavaScript validation แทน HTML5 validation
        addInboundForm.setAttribute('novalidate', 'true');
        addInboundForm.addEventListener('submit', handleAddInbound);
    }

    const editInboundForm = document.getElementById('edit-inbound-form');
    if (editInboundForm) {
        editInboundForm.addEventListener('submit', handleEditInbound);
    }
}

// ฟังก์ชันการเลือกสินค้า
function handleProductSelect() {
    const selectElement = document.getElementById('product-select');
    const existingProductDiv = document.getElementById('existing-product');
    const newProductDiv = document.getElementById('new-product');

    // เคลียร์ค่าข้อผิดพลาดถ้ามี
    clearErrorMessage('product-select-error');
    clearErrorMessage('new-product-name-error');
    clearErrorMessage('product-error');
    clearErrorMessage('add-inbound-error');

    if (selectElement.value === 'new') {
        // แสดงฟอร์มสำหรับเพิ่มสินค้าใหม่
        existingProductDiv.style.display = 'none';
        newProductDiv.style.display = 'block';

        // ทำให้ฟิลด์ในส่วนของสินค้าใหม่เป็น required
        const newProductNameField = document.getElementById('new-product-name');
        if (newProductNameField) {
            newProductNameField.setAttribute('required', 'true');
        }

        // ยกเลิก required ของฟิลด์ในส่วนของสินค้าที่มีอยู่แล้ว
        const productIdField = document.getElementById('product-id');
        if (productIdField) {
            productIdField.removeAttribute('required');
        }
    } else if (selectElement.value) {
        // เลือกสินค้าที่มีอยู่แล้ว
        existingProductDiv.style.display = 'block';
        newProductDiv.style.display = 'none';

        // ยกเลิก required ของฟิลด์ในส่วนของสินค้าใหม่
        const newProductNameField = document.getElementById('new-product-name');
        if (newProductNameField) {
            newProductNameField.removeAttribute('required');
        }

        // ทำให้ฟิลด์ในส่วนของสินค้าที่มีอยู่แล้วเป็น required
        const productIdField = document.getElementById('product-id');
        if (productIdField) {
            productIdField.setAttribute('required', 'true');
        }

        // ดึงข้อมูลสินค้าที่เลือก
        fetchAPI(`/api/products/${selectElement.value}`)
            .then(product => {
                document.getElementById('product-id').value = product.id;
                document.getElementById('product').value = product.name;
                document.getElementById('current-stock').value = product.quantity;
            })
            .catch(error => {
                showErrorMessage('product-select-error', 'ไม่สามารถโหลดข้อมูลสินค้าได้');
            });
    } else {
        // ไม่ได้เลือกอะไร
        existingProductDiv.style.display = 'none';
        newProductDiv.style.display = 'none';

        // ยกเลิก required ของทุกฟิลด์
        const newProductNameField = document.getElementById('new-product-name');
        if (newProductNameField) {
            newProductNameField.removeAttribute('required');
        }

        const productIdField = document.getElementById('product-id');
        if (productIdField) {
            productIdField.removeAttribute('required');
        }
    }
}

// โหลดตัวเลือกสินค้าสำหรับเลือกในฟอร์ม
function loadProductOptions() {
    fetchAPI('/api/products')
        .then(products => {
            const productSelect = document.getElementById('product-select');

            // เก็บตัวเลือกแรก (-- เลือกสินค้า --) และตัวเลือกที่สอง (++ เพิ่มสินค้าใหม่ ++)
            const firstOptions = productSelect.innerHTML;

            // ล้างตัวเลือกเดิมและใส่ตัวเลือกเริ่มต้นกลับไป
            productSelect.innerHTML = firstOptions;

            // เพิ่มตัวเลือกสินค้าที่มีอยู่แล้ว
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (คงเหลือ: ${product.quantity})`;
                productSelect.appendChild(option);
            });
        })
        .catch(error => {
            showErrorMessage('product-select-error', 'ไม่สามารถโหลดข้อมูลสินค้าได้');
        });
}

// โหลดข้อมูลการรับสินค้าทั้งหมด
function loadInboundLogs() {
    fetchAPI('/api/inbound')
        .then(inboundLogs => {
            renderInboundTable(inboundLogs);
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการรับสินค้า:', error);
        });
}

// แสดงข้อมูลการรับสินค้าในตาราง
function renderInboundTable(inboundLogs) {
    const tableBody = document.querySelector('#inbound-table tbody');
    tableBody.innerHTML = '';

    inboundLogs.forEach(inbound => {
        const row = document.createElement('tr');
        const formattedDate = formatDate(inbound.receivedDate);

        row.innerHTML = `
            <td>${inbound.product.name}</td>
            <td>${inbound.product.description || '-'}</td>
            <td>${inbound.quantityReceived}</td>
            <td>${inbound.supplierName || '-'}</td>
            <td>${inbound.referenceNumber || '-'}</td>
            <td>${formattedDate}</td>
            <td>${inbound.receivedBy || '-'}</td>
            <td>
                <button class="btn" onclick="editInbound(${inbound.id})">แก้ไข</button>
                <button class="btn btn-danger" onclick="deleteInbound(${inbound.id})">ลบ</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ค้นหาประวัติการรับสินค้า
function searchInboundLogs() {
    const keyword = document.getElementById('search-keyword').value.trim();

    if (!keyword) {
        loadInboundLogs();
        return;
    }

    fetchAPI(`/api/inbound/supplier?supplierName=${encodeURIComponent(keyword)}`)
        .then(inboundLogs => {
            renderInboundTable(inboundLogs);
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการค้นหาการรับสินค้า:', error);
        });
}

// จัดการการส่งฟอร์มเพิ่มข้อมูลการรับสินค้า
function handleAddInbound(e) {
    e.preventDefault();

    // เคลียร์ข้อความผิดพลาดทั้งหมด
    clearErrorMessage('add-inbound-error');
    clearErrorMessage('product-select-error');
    clearErrorMessage('new-product-name-error');
    clearErrorMessage('quantity-error');

    // ตรวจสอบว่ามีการระบุจำนวนที่รับหรือไม่
    const quantity = document.getElementById('quantity').value;
    if (!quantity || parseInt(quantity) <= 0) {
        showErrorMessage('quantity-error', 'กรุณาระบุจำนวนที่รับให้มากกว่า 0');
        return;
    }

    // ตรวจสอบว่ามีการกรอกข้อมูลผู้จัดส่งหรือไม่
    const supplier = document.getElementById('supplier').value.trim();
    if (!supplier) {
        showErrorMessage('add-inbound-error', 'กรุณาระบุผู้จัดส่ง');
        document.getElementById('supplier').focus();
        return;
    }

    // ตรวจสอบว่ามีการกรอกเลขที่ใบส่งสินค้าหรือไม่
    const reference = document.getElementById('reference').value.trim();
    if (!reference) {
        showErrorMessage('add-inbound-error', 'กรุณาระบุเลขที่ใบส่งสินค้า');
        document.getElementById('reference').focus();
        return;
    }

    // ตรวจสอบว่ามีการระบุวันที่รับสินค้าหรือไม่
    const receivedDate = document.getElementById('receivedDate').value;
    if (!receivedDate) {
        showErrorMessage('add-inbound-error', 'กรุณาระบุวันที่รับสินค้า');
        document.getElementById('receivedDate').focus();
        return;
    }

    const selectedOption = document.getElementById('product-select').value;

    if (selectedOption === '') {
        showErrorMessage('product-select-error', 'กรุณาเลือกสินค้าหรือเพิ่มสินค้าใหม่');
        document.getElementById('product-select').focus();
        return;
    }

    if (selectedOption === 'new') {
        // กรณีเพิ่มสินค้าใหม่พร้อมกับการรับสินค้า
        const newProductName = document.getElementById('new-product-name').value;
        if (!newProductName.trim()) {
            showErrorMessage('new-product-name-error', 'กรุณากรอกชื่อสินค้า');
            document.getElementById('new-product-name').focus();
            return;
        }

        // สร้างข้อมูลสินค้าใหม่
        const newProductData = {
            name: newProductName,
            description: document.getElementById('new-product-desc').value || '',
            quantity: 0, // เริ่มต้นที่ 0 เพราะจะเพิ่มจากการรับสินค้า
            location: document.getElementById('new-product-location') ? document.getElementById('new-product-location').value || '' : '',
            minimumStock: parseInt(document.getElementById('new-product-min') ? document.getElementById('new-product-min').value : 10) || 10
        };

        // บันทึกสินค้าใหม่ก่อน แล้วจึงบันทึกการรับสินค้า
        createNewProductThenInbound(newProductData);
    } else {
        // กรณีเลือกสินค้าที่มีอยู่แล้ว
        const productIdElement = document.getElementById('product-id');
        if (!productIdElement || !productIdElement.value) {
            showErrorMessage('product-select-error', 'ข้อมูลสินค้าไม่ถูกต้อง กรุณาเลือกสินค้าใหม่อีกครั้ง');
            document.getElementById('product-select').focus();
            return;
        }

        submitExistingProductInbound(productIdElement.value);
    }
}

// ฟังก์ชันสำหรับสร้างสินค้าใหม่แล้วบันทึกการรับสินค้า
function createNewProductThenInbound(productData) {
    // บันทึกสินค้าใหม่
    fetchAPI('/api/products', 'POST', productData)
        .then(newProduct => {
            // เมื่อสร้างสินค้าใหม่สำเร็จ ให้บันทึกการรับสินค้า
            submitExistingProductInbound(newProduct.id);

            // เพิ่มการอัปเดตข้อมูลในหน้า products ถ้าอยู่ในหน้าเดียวกัน
            if (typeof loadProducts === 'function') {
                loadProducts();
            }
        })
        .catch(error => {
            showErrorMessage('add-inbound-error', 'ไม่สามารถเพิ่มสินค้าใหม่ได้: ' + error.message);
        });
}

// ฟังก์ชันสำหรับแสดงข้อความกำลังดำเนินการ
function showLoadingMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        element.classList.remove('error-message');
        element.classList.add('info-message');
    }
}

// ฟังก์ชันสำหรับบันทึกการรับสินค้าสำหรับสินค้าที่มีอยู่แล้ว
function submitExistingProductInbound(productId) {
    const receivedDateElement = document.getElementById('receivedDate');
    const receivedDate = receivedDateElement && receivedDateElement.value
        ? new Date(receivedDateElement.value).toISOString()
        : new Date().toISOString();

    const quantityReceived = parseInt(document.getElementById('quantity').value);

    // ดึงข้อมูลสินค้าเพื่อตรวจสอบตำแหน่งจัดเก็บ
    fetchAPI(`/api/products/${productId}`)
        .then(product => {
            // ถ้าสินค้ามีตำแหน่งจัดเก็บ ให้ตรวจสอบความจุก่อน
            if (product.location) {
                return fetchAPI(`/api/locations/search?keyword=${encodeURIComponent(product.location)}`)
                    .then(locations => {
                        if (locations.length > 0) {
                            const location = locations[0];
                            // คำนวณการใช้งานใหม่หลังจากรับสินค้า
                            const newUtilization = location.currentUtilization + quantityReceived;

                            // ตรวจสอบว่าการใช้งานใหม่ไม่เกินความจุ
                            if (newUtilization > location.capacity) {
                                throw new Error(`การรับสินค้าจะทำให้เกินความจุของตำแหน่ง ${location.name} (ความจุ: ${location.capacity}, ปัจจุบัน: ${location.currentUtilization}, จะเพิ่ม: ${quantityReceived}, รวม: ${newUtilization})`);
                            }
                        }
                        return product;
                    });
            }
            return product;
        })
        .then(product => {
            const inboundData = {
                product: { id: productId },
                quantityReceived: quantityReceived,
                supplierName: document.getElementById('supplier') ? document.getElementById('supplier').value || '' : '',
                referenceNumber: document.getElementById('reference') ? document.getElementById('reference').value || '' : '',
                receivedBy: localStorage.getItem('username') || '',
                receivedDate: receivedDate
            };

            // บันทึกการรับสินค้า
            return fetchAPI('/api/inbound', 'POST', inboundData);
        })
        .then(data => {
            // รีเซ็ตฟอร์มและโหลดข้อมูลใหม่
            document.getElementById('add-inbound-form').reset();

            // ซ่อนฟอร์มเพิ่มสินค้าใหม่และฟอร์มสินค้าที่มีอยู่แล้ว
            document.getElementById('existing-product').style.display = 'none';
            document.getElementById('new-product').style.display = 'none';

            // โหลดข้อมูลใหม่
            loadInboundLogs();
            loadProductOptions();

            // เพิ่มการอัปเดตข้อมูลในหน้า products ถ้าอยู่ในหน้าเดียวกัน
            if (typeof loadProducts === 'function') {
                loadProducts();
            }

            // แสดงข้อความแจ้งเตือน
            alert('บันทึกการรับสินค้าสำเร็จ');

            // ตั้งค่าวันที่รับสินค้าเป็นวันที่ปัจจุบันอีกครั้ง
            if (receivedDateElement) {
                receivedDateElement.value = formatDateForInput(new Date());
            }

            // ซ่อนข้อความกำลังดำเนินการ
            clearErrorMessage('add-inbound-error');
        })
        .catch(error => {
            showErrorMessage('add-inbound-error', 'ไม่สามารถบันทึกการรับสินค้าได้: ' + error.message);
        });
}

// เตรียมฟอร์มสำหรับแก้ไขข้อมูลการรับสินค้า
function editInbound(inboundId) {
    fetchAPI(`/api/inbound/${inboundId}`)
        .then(inbound => {
            populateEditInboundForm(inbound);
            openModal('edit-inbound-modal');
        })
        .catch(error => {
            alert('ไม่สามารถโหลดข้อมูลการรับสินค้าได้');
        });
}

// กรอกข้อมูลในฟอร์มแก้ไข
function populateEditInboundForm(inbound) {
    document.getElementById('edit-inbound-id').value = inbound.id;
    document.getElementById('edit-product').value = inbound.product.name;
    document.getElementById('edit-quantity').value = inbound.quantityReceived;
    document.getElementById('edit-supplier').value = inbound.supplierName || '';
    document.getElementById('edit-reference').value = inbound.referenceNumber || '';
    document.getElementById('edit-date').value = formatDateForInput(inbound.receivedDate);

    // กรอกข้อมูลรายละเอียดสินค้า
    document.getElementById('edit-product-desc').value = inbound.product.description || '';

    // เก็บข้อมูลเดิมไว้เพื่อเปรียบเทียบการเปลี่ยนแปลง
    document.getElementById('edit-inbound-form').setAttribute('data-original-product-id', inbound.product.id);
    document.getElementById('edit-inbound-form').setAttribute('data-original-product-desc', inbound.product.description || '');
    document.getElementById('edit-inbound-form').setAttribute('data-original-quantity', inbound.quantityReceived);
}

// จัดการการส่งฟอร์มแก้ไขข้อมูลการรับสินค้า
function handleEditInbound(e) {
    e.preventDefault();

    const inboundId = document.getElementById('edit-inbound-id').value;
    const originalProductId = e.target.getAttribute('data-original-product-id');
    const originalProductDesc = e.target.getAttribute('data-original-product-desc') || '';
    const originalQuantity = parseInt(e.target.getAttribute('data-original-quantity'));
    const newProductDesc = document.getElementById('edit-product-desc').value || '';
    const newQuantity = parseInt(document.getElementById('edit-quantity').value);

    // ตรวจสอบว่ามีการระบุจำนวนที่รับหรือไม่
    if (!newQuantity || newQuantity <= 0) {
        showErrorMessage('edit-quantity-error', 'กรุณาระบุจำนวนที่รับให้มากกว่า 0');
        return;
    }

    // รวบรวมข้อมูลจากฟอร์ม
    const formData = {
        product: {
            id: originalProductId,
            name: document.getElementById('edit-product').value,
            description: newProductDesc
        },
        quantityReceived: newQuantity,
        supplierName: document.getElementById('edit-supplier').value || '',
        referenceNumber: document.getElementById('edit-reference').value || '',
        receivedDate: new Date(document.getElementById('edit-date').value).toISOString()
    };

    // ส่งคำขอแก้ไข
    fetchAPI(`/api/inbound/${inboundId}`, 'PUT', formData)
        .then(data => {
            // ตรวจสอบว่ามีการเปลี่ยนแปลงรายละเอียดสินค้าหรือไม่
            if (originalProductDesc !== newProductDesc) {
                // อัปเดตข้อมูลสินค้าด้วย
                return fetchAPI(`/api/products/${originalProductId}`)
                    .then(product => {
                        product.description = newProductDesc;
                        return fetchAPI(`/api/products/${originalProductId}`, 'PUT', product);
                    })
                    .then(() => data);
            }
            return data;
        })
        .then(data => {
            closeEditModal();
            loadInboundLogs();
            loadProductOptions(); // โหลดข้อมูลสินค้าใหม่เพื่ออัปเดตจำนวนคงเหลือ

            // เพิ่มการอัปเดตข้อมูลในหน้า products ถ้าอยู่ในหน้าเดียวกัน
            if (typeof loadProducts === 'function') {
                loadProducts();
            }

            alert('แก้ไขข้อมูลการรับสินค้าสำเร็จ');
        })
        .catch(error => {
            showErrorMessage('edit-inbound-error', 'ไม่สามารถแก้ไขข้อมูลการรับสินค้าได้: ' + error.message);
        });
}

// ปิดหน้าต่าง modal แก้ไขข้อมูลการรับสินค้า
function closeEditModal() {
    closeModal('edit-inbound-modal', 'edit-inbound-form', 'edit-inbound-error');
}

// ลบข้อมูลการรับสินค้า
function deleteInbound(inboundId) {
    confirmAction('คุณต้องการลบข้อมูลการรับสินค้านี้หรือไม่? การลบจะส่งผลต่อจำนวนสินค้าคงเหลือด้วย', () => {
        // ใช้ fetch โดยตรงแทน fetchAPI เพื่อจัดการกับการตอบกลับที่ไม่ใช่ JSON
        fetch(`/api/inbound/${inboundId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                // ตรวจสอบว่าการตอบกลับเป็น OK หรือไม่
                if (!response.ok) {
                    // ถ้าไม่ OK ให้พยายามอ่านข้อความข้อผิดพลาด
                    return response.json().catch(() => {
                        // ถ้าไม่สามารถแปลงเป็น JSON ได้ ให้ใช้ status text
                        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
                    }).then(errorData => {
                        // ถ้าแปลงเป็น JSON ได้ ให้ใช้ข้อความจาก JSON
                        throw new Error(errorData.message || JSON.stringify(errorData));
                    });
                }

                // ถ้า OK ให้พยายามอ่านข้อมูล JSON
                return response.json().catch(() => {
                    // ถ้าไม่มีข้อมูล JSON ให้ส่งค่าว่างกลับไป
                    return { status: 'success', message: 'ลบข้อมูลการรับสินค้าสำเร็จ' };
                });
            })
            .then(data => {
                // โหลดข้อมูลใหม่
                loadInboundLogs();
                loadProductOptions();

                // เพิ่มการอัปเดตข้อมูลในหน้า products ถ้าอยู่ในหน้าเดียวกัน
                if (typeof loadProducts === 'function') {
                    loadProducts();
                }

                // แสดงข้อความแจ้งเตือน
                alert(data.message || 'ลบข้อมูลการรับสินค้าสำเร็จ');
            })
            .catch(error => {
                // แสดงข้อความข้อผิดพลาด
                alert('ไม่สามารถลบข้อมูลการรับสินค้าได้: ' + error.message);

                // รีเฟรชข้อมูลเพื่อให้แน่ใจว่าแสดงข้อมูลล่าสุด
                setTimeout(() => {
                    loadInboundLogs();
                    loadProductOptions();
                }, 1000);
            });
    });
}
