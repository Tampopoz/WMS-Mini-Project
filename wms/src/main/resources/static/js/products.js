// JavaScript สำหรับการจัดการสินค้าในระบบคลังสินค้า

document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบเซสชันผู้ใช้ก่อนแสดงข้อมูล
    checkSession(() => {
        // เมื่อตรวจสอบเซสชันสำเร็จแล้ว
        loadProducts();
        loadLocations(); // โหลดข้อมูลตำแหน่งจัดเก็บ
        setupProductForms();
    });
});

// ตั้งค่า event listeners สำหรับแบบฟอร์มจัดการสินค้า
function setupProductForms() {
    const editProductForm = document.getElementById('edit-product-form');
    if (editProductForm) {
        editProductForm.addEventListener('submit', handleEditProduct);
    }
}

// โหลดข้อมูลตำแหน่งจัดเก็บสำหรับเลือกในฟอร์ม
function loadLocations() {
    fetchAPI('/api/locations')
        .then(locations => {
            populateLocationDropdowns(locations);
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลตำแหน่งจัดเก็บ:', error);
        });
}

// เติมข้อมูลในดรอปดาวน์ตำแหน่งจัดเก็บสำหรับฟอร์มแก้ไข
function populateLocationDropdowns(locations) {
    // ดรอปดาวน์สำหรับฟอร์มแก้ไขสินค้า
    const editLocationSelect = document.getElementById('edit-location');

    // ล้างตัวเลือกเดิมยกเว้นตัวแรก
    editLocationSelect.innerHTML = '<option value="">-- เลือกตำแหน่ง --</option>';

    // กรองเฉพาะตำแหน่งที่พร้อมใช้งาน
    const availableLocations = locations.filter(location =>
        location.status === 'พร้อมใช้งาน' && location.availableCapacity > 0);

    // เพิ่มตัวเลือกตำแหน่ง
    availableLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.name;
        option.textContent = `${location.name} (ว่าง: ${location.availableCapacity})`;
        editLocationSelect.appendChild(option);
    });
}

// ฟังก์ชันโหลดข้อมูลสินค้าทั้งหมด
function loadProducts() {
    fetchAPI('/api/products')
        .then(products => renderProductsTable(products))
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า:', error);
        });
}

// ฟังก์ชันแสดงข้อมูลสินค้าในตาราง
function renderProductsTable(products) {
    const tableBody = document.querySelector('#products-table tbody');
    tableBody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');

        if (product.lowStock) {
            row.style.backgroundColor = '#ffdddd';
        }

        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.description || '-'}</td>
            <td>${product.quantity}</td>
            <td>${product.location || '-'}</td>
            <td>${product.minimumStock}</td>
            <td>
                <button class="btn" onclick="editProduct(${product.id})">แก้ไข</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ฟังก์ชันค้นหาสินค้า
function searchProducts() {
    const keyword = document.getElementById('search-keyword').value.trim();

    if (!keyword) {
        loadProducts();
        return;
    }

    fetchAPI(`/api/products/search?keyword=${encodeURIComponent(keyword)}`)
        .then(products => renderProductsTable(products))
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการค้นหาสินค้า:', error);
        });
}

// แสดงเฉพาะสินค้าที่มีจำนวนต่ำกว่าขั้นต่ำ
function showLowStockOnly() {
    fetchAPI('/api/products/low-stock')
        .then(products => renderProductsTable(products))
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้าใกล้หมด:', error);
        });
}

// ฟังก์ชันเตรียมฟอร์มสำหรับแก้ไขสินค้า
function editProduct(productId) {
    // โหลดข้อมูลตำแหน่งจัดเก็บใหม่ก่อนเปิด modal
    fetchAPI('/api/locations')
        .then(locations => {
            populateLocationDropdowns(locations);
            // เมื่อโหลดตำแหน่งเสร็จแล้ว จึงโหลดข้อมูลสินค้า
            return fetchAPI(`/api/products/${productId}`);
        })
        .then(product => {
            populateEditProductForm(product);
            openModal('edit-product-modal');
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า:', error);
            alert('ไม่สามารถโหลดข้อมูลสินค้าได้');
        });
}

// กรอกข้อมูลในฟอร์มแก้ไขสินค้า
function populateEditProductForm(product) {
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-description').value = product.description || '';
    document.getElementById('edit-quantity').value = product.quantity;
    document.getElementById('edit-minimumStock').value = product.minimumStock;

    // เก็บค่าตำแหน่งเดิมไว้เพื่อเปรียบเทียบเมื่อมีการแก้ไข
    document.getElementById('edit-product-form').setAttribute('data-original-location', product.location || '');
    document.getElementById('edit-product-form').setAttribute('data-original-quantity', product.quantity || 0);

    // ตั้งค่าตำแหน่งจัดเก็บในดรอปดาวน์
    const locationSelect = document.getElementById('edit-location');
    if (product.location) {
        // ตรวจสอบว่ามีตัวเลือกที่ตรงกับตำแหน่งของสินค้าหรือไม่
        let found = false;
        for (let i = 0; i < locationSelect.options.length; i++) {
            if (locationSelect.options[i].value === product.location) {
                locationSelect.selectedIndex = i;
                found = true;
                break;
            }
        }

        // ถ้าไม่พบตัวเลือกที่ตรงกัน ให้เพิ่มตัวเลือกใหม่
        if (!found) {
            const option = document.createElement('option');
            option.value = product.location;
            option.textContent = `${product.location} (ตำแหน่งปัจจุบัน)`;
            locationSelect.appendChild(option);
            locationSelect.value = product.location;
        }
    } else {
        locationSelect.selectedIndex = 0; // เลือกตัวเลือกแรก (-- เลือกตำแหน่ง --)
    }
}

// ฟังก์ชันจัดการการส่งฟอร์มแก้ไขสินค้า
function handleEditProduct(e) {
    e.preventDefault();

    const productId = document.getElementById('edit-product-id').value;
    const originalLocation = e.target.getAttribute('data-original-location') || '';
    const originalQuantity = parseInt(e.target.getAttribute('data-original-quantity') || 0);
    const newLocation = document.getElementById('edit-location').value;
    const newQuantity = parseInt(document.getElementById('edit-quantity').value);

    const formData = {
        name: document.getElementById('edit-name').value,
        description: document.getElementById('edit-description').value,
        quantity: newQuantity,
        location: newLocation,
        minimumStock: parseInt(document.getElementById('edit-minimumStock').value)
    };

    // ถ้าไม่ได้เลือกตำแหน่งใหม่ ข้ามการตรวจสอบความจุ
    if (!newLocation) {
        performUpdate();
        return;
    }

    // ดึงข้อมูลตำแหน่งเพื่อตรวจสอบความจุ
    fetchAPI(`/api/locations/search?keyword=${encodeURIComponent(newLocation)}`)
        .then(locations => {
            if (locations.length === 0) {
                throw new Error('ไม่พบข้อมูลตำแหน่งที่เลือก');
            }

            const location = locations[0];

            // คำนวณการใช้งานปัจจุบันของตำแหน่ง
            const currentUtilization = location.currentUtilization || 0;

            // ถ้าเป็นตำแหน่งเดิม ให้คำนวณการใช้งานหลังจากเปลี่ยนจำนวน
            if (originalLocation === newLocation) {
                // คำนวณการใช้งานใหม่ = การใช้งานปัจจุบัน - จำนวนเดิม + จำนวนใหม่
                const newUtilization = currentUtilization - originalQuantity + newQuantity;

                // ตรวจสอบว่าการใช้งานใหม่ไม่เกินความจุ
                if (newUtilization > location.capacity) {
                    showErrorMessage('edit-product-error', `ไม่สามารถแก้ไขข้อมูลสินค้าได้: จำนวนสินค้าเกินความจุของตำแหน่งจัดเก็บ (ความจุ: ${location.capacity}, จะใช้: ${newUtilization})`);
                    return;
                }

                performUpdate();
                return;
            }

            // ถ้าเป็นตำแหน่งใหม่ ตรวจสอบว่าจำนวนใหม่ไม่เกินความจุที่เหลือ
            const availableCapacity = location.capacity - currentUtilization;
            if (newQuantity > availableCapacity) {
                showErrorMessage('edit-product-error', `ไม่สามารถแก้ไขข้อมูลสินค้าได้: จำนวนสินค้าเกินความจุที่เหลือของตำแหน่งจัดเก็บ (เหลือ: ${availableCapacity}, ต้องการ: ${newQuantity})`);
                return;
            }

            // ถ้าผ่านการตรวจสอบความจุ ดำเนินการอัปเดต
            performUpdate();
        })
        .catch(error => {
            showErrorMessage('edit-product-error', 'ไม่สามารถแก้ไขข้อมูลสินค้าได้: ' + error.message);
        });

    // ฟังก์ชันสำหรับดำเนินการอัปเดตจริง
    function performUpdate() {
        // ส่งคำขอแก้ไขข้อมูลสินค้า
        fetchAPI(`/api/products/${productId}`, 'PUT', formData)
            .then(data => {
                // ตรวจสอบว่ามีการเปลี่ยนแปลงตำแหน่งหรือจำนวนหรือไม่
                if (originalLocation !== newLocation || originalQuantity !== newQuantity) {
                    // ถ้ามีการเปลี่ยนแปลง ให้อัปเดตข้อมูลการใช้งานของตำแหน่ง
                    return updateLocationUtilization(originalLocation, newLocation, originalQuantity, newQuantity);
                }
                return data;
            })
            .then(() => {
                closeEditModal();
                loadProducts();

                // เพิ่มการอัปเดตข้อมูลในหน้า inbound ถ้าอยู่ในหน้าเดียวกัน
                if (typeof loadInboundLogs === 'function') {
                    loadInboundLogs();
                }

                alert('แก้ไขข้อมูลสินค้าสำเร็จ');
            })
            .catch(error => {
                showErrorMessage('edit-product-error', 'ไม่สามารถแก้ไขข้อมูลสินค้าได้: ' + error.message);
            });
    }
}

// ฟังก์ชันอัปเดตข้อมูลการใช้งานของตำแหน่ง
function updateLocationUtilization(oldLocation, newLocation, oldQuantity, newQuantity) {
    const updates = [];

    // กรณีที่ตำแหน่งเดิมและตำแหน่งใหม่เป็นตำแหน่งเดียวกัน
    if (oldLocation && oldLocation === newLocation) {
        // ดึงข้อมูลตำแหน่งและอัปเดตการใช้งานโดยตรง
        updates.push(
            fetchAPI(`/api/locations/search?keyword=${encodeURIComponent(newLocation)}`)
                .then(locations => {
                    if (locations.length > 0) {
                        const location = locations[0];
                        // คำนวณการใช้งานใหม่ = การใช้งานปัจจุบัน - จำนวนเดิม + จำนวนใหม่
                        const newUtilization = location.currentUtilization - oldQuantity + newQuantity;

                        if (newUtilization > location.capacity) {
                            throw new Error(`การเพิ่มสินค้าจะทำให้เกินความจุของตำแหน่ง`);
                        }

                        // อัปเดตการใช้งานของตำแหน่ง
                        location.currentUtilization = newUtilization;
                        return fetchAPI(`/api/locations/${location.id}`, 'PUT', location);
                    }
                    return null;
                })
                .catch(error => {
                    console.error('เกิดข้อผิดพลาดในการอัปเดตตำแหน่ง:', error);
                    throw error;
                })
        );

        // รอให้การอัปเดตเสร็จสิ้น
        return Promise.all(updates);
    }

    // กรณีที่ตำแหน่งเดิมและตำแหน่งใหม่เป็นคนละตำแหน่ง

    // ถ้ามีตำแหน่งเดิม ให้ลดการใช้งานของตำแหน่งเดิม
    if (oldLocation && oldLocation !== newLocation) {
        updates.push(
            fetchAPI(`/api/locations/search?keyword=${encodeURIComponent(oldLocation)}`)
                .then(locations => {
                    if (locations.length > 0) {
                        const location = locations[0];
                        // ลดการใช้งานของตำแหน่งเดิม
                        location.currentUtilization = Math.max(0, location.currentUtilization - oldQuantity);
                        return fetchAPI(`/api/locations/${location.id}`, 'PUT', location);
                    }
                    return null;
                })
                .catch(error => {
                    console.error('เกิดข้อผิดพลาดในการอัปเดตตำแหน่งเดิม:', error);
                })
        );
    }

    // ถ้ามีตำแหน่งใหม่ ให้เพิ่มการใช้งานของตำแหน่งใหม่
    if (newLocation && oldLocation !== newLocation) {
        updates.push(
            fetchAPI(`/api/locations/search?keyword=${encodeURIComponent(newLocation)}`)
                .then(locations => {
                    if (locations.length > 0) {
                        const location = locations[0];
                        // ตรวจสอบว่าการเพิ่มจำนวนใหม่จะไม่ทำให้เกินความจุ
                        const newUtilization = location.currentUtilization + newQuantity;
                        if (newUtilization > location.capacity) {
                            throw new Error(`การเพิ่มสินค้าจะทำให้เกินความจุของตำแหน่ง`);
                        }
                        // เพิ่มการใช้งานของตำแหน่งใหม่
                        location.currentUtilization = newUtilization;
                        return fetchAPI(`/api/locations/${location.id}`, 'PUT', location);
                    }
                    return null;
                })
                .catch(error => {
                    console.error('เกิดข้อผิดพลาดในการอัปเดตตำแหน่งใหม่:', error);
                    throw error; // ส่งต่อ error เพื่อให้ผู้ใช้ทราบ
                })
        );
    }

    // รอให้ทุกการอัปเดตเสร็จสิ้น
    return Promise.all(updates);
}

// ฟังก์ชันปิดหน้าต่าง modal แก้ไขสินค้า
function closeEditModal() {
    closeModal('edit-product-modal', 'edit-product-form', 'edit-product-error');
}
