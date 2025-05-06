// ไฟล์ JavaScript หลักสำหรับใช้งานทั่วไปในระบบคลังสินค้า (WMS)

// รอให้เอกสาร HTML โหลดเสร็จสมบูรณ์ก่อนจึงทำงาน
document.addEventListener('DOMContentLoaded', () => {
    // ค้นหาปุ่มออกจากระบบและผูกกับฟังก์ชันล็อกเอาท์
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // ตรวจสอบเซสชันและแสดงองค์ประกอบ UI ตามสิทธิ์ผู้ใช้
    checkSession(userData => {
        // ตรวจสอบและแสดงองค์ประกอบสำหรับแอดมิน
        setupAdminFeatures(userData);
    });
});

// ฟังก์ชันจัดการการออกจากระบบ
function handleLogout() {
    fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
    })
        .then(response => {
            if (response.ok) {
                // ล้างข้อมูลผู้ใช้ออกจาก localStorage
                const userKeys = ['username', 'userId', 'fullName', 'userRole', 'loginTime'];
                userKeys.forEach(key => localStorage.removeItem(key));

                // นำทางกลับไปยังหน้าล็อกอิน
                window.location.href = '/login.html';
            }
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการออกจากระบบ:', error);
        });
}

// ฟังก์ชันตั้งค่าฟีเจอร์สำหรับ Admin
function setupAdminFeatures(userData) {
    if (userData.role === 'ADMIN') {
        // แสดงลิงก์และองค์ประกอบสำหรับ Admin
        const adminLinks = document.querySelectorAll('#admin-link');
        adminLinks.forEach(link => {
            link.style.display = 'inline-block';
        });

        const adminOnlyElements = document.querySelectorAll('.admin-only');
        adminOnlyElements.forEach(el => {
            el.style.display = 'block';
        });
    }
}

// ฟังก์ชันตรวจสอบเซสชันผู้ใช้ว่ายังล็อกอินอยู่หรือไม่
function checkSession(onSuccess, onFailure, requireAdmin) {
    // ถ้ากำลังอยู่ที่หน้าล็อกอินหรือลงทะเบียน ไม่ต้องตรวจสอบเซสชัน
    const currentPage = window.location.pathname;
    if (currentPage.includes('/login.html') || currentPage.includes('/register.html')) {
        // ถ้ามีการระบุ onFailure callback ให้เรียกใช้
        if (typeof onFailure === 'function') {
            onFailure();
        }
        return; // ออกจากฟังก์ชันเลย ไม่ต้องตรวจสอบเซสชัน
    }

    fetch('/api/auth/check-session')
        .then(response => {
            if (!response.ok) {
                throw new Error('ไม่มีเซสชันที่ใช้งานอยู่');
            }
            return response.json();
        })
        .then(data => {
            // อัปเดตข้อมูลใน localStorage ให้สอดคล้องกับข้อมูลเซสชัน
            const userData = {
                username: data.username,
                userId: data.userId,
                userRole: data.role
            };

            // เก็บข้อมูลที่ยังไม่มีใน localStorage
            Object.keys(userData).forEach(key => {
                if (userData[key] && !localStorage.getItem(key)) {
                    localStorage.setItem(key, userData[key]);
                }
            });

            // ตรวจสอบว่าผู้ใช้เป็นผู้ดูแลระบบหรือไม่
            if (requireAdmin && data.role !== 'ADMIN') {
                window.location.href = '/index.html';
                return;
            }

            // เรียกฟังก์ชัน onSuccess พร้อมส่งข้อมูลผู้ใช้
            if (typeof onSuccess === 'function') {
                onSuccess(data);
            }
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการตรวจสอบเซสชัน:', error);
            if (typeof onFailure === 'function') {
                onFailure(error);
            } else {
                // เพิ่มเงื่อนไขตรวจสอบว่าไม่ได้อยู่ในหน้าล็อกอินอยู่แล้ว (เพื่อป้องกันลูป)
                if (!window.location.pathname.includes('/login.html')) {
                    window.location.href = '/login.html';
                }
            }
        });
}

// ฟังก์ชันสำหรับการยิง API request แบบทั่วไป
function fetchAPI(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                return response.json().catch(() => {
                    // ถ้าไม่สามารถแปลงเป็น JSON ได้ ให้ใช้ text แทน
                    return response.text().then(text => {
                        throw new Error(text);
                    });
                }).then(errorData => {
                    // ถ้าแปลงเป็น JSON ได้ ให้ใช้ message จาก JSON
                    if (errorData.message) {
                        throw new Error(errorData.message);
                    } else {
                        throw new Error(JSON.stringify(errorData));
                    }
                });
            }
            return response.json();
        });
}

// ฟังก์ชันแสดงข้อความข้อผิดพลาด
function showErrorMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

// ฟังก์ชันล้างข้อความข้อผิดพลาด
function clearErrorMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

// ฟังก์ชันตรวจสอบความถูกต้องของฟอร์ม
function validateForm(formId, validationRules) {
    const form = document.getElementById(formId);
    if (!form) return false;

    // ล้างข้อความข้อผิดพลาดเดิม
    form.querySelectorAll('.error-message').forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });

    let isValid = true;

    // ตรวจสอบแต่ละฟิลด์ตามกฎที่กำหนด
    for (const field in validationRules) {
        const input = form.elements[field];
        const rules = validationRules[field];

        for (const rule of rules) {
            if (rule.type === 'required' && !input.value.trim()) {
                showErrorMessage(`${field}-error`, rule.message || 'กรุณากรอกข้อมูลในช่องนี้');
                isValid = false;
                break;
            }
            else if (rule.type === 'min' && parseInt(input.value) < rule.value) {
                showErrorMessage(`${field}-error`, rule.message || `ค่าต้องไม่น้อยกว่า ${rule.value}`);
                isValid = false;
                break;
            }
        }
    }

    return isValid;
}

// ฟังก์ชัน utility สำหรับการจัดการข้อมูล location ใน localStorage
function saveLocationStats(totalLocations, usedLocations, availableLocations) {
    localStorage.setItem('wms_total_locations', totalLocations);
    localStorage.setItem('wms_used_locations', usedLocations);
    localStorage.setItem('wms_available_locations', availableLocations);
    localStorage.setItem('wms_locations_last_updated', new Date().getTime());

    // ส่ง custom event เพื่อแจ้งการอัปเดตข้อมูล
    document.dispatchEvent(new CustomEvent('wms_locations_updated'));
}

// ฟังก์ชันปิด Modal ทั่วไป
function closeModal(modalId, formId, errorId) {
    document.getElementById(modalId).style.display = 'none';
    if (formId) document.getElementById(formId).reset();
    if (errorId) document.getElementById(errorId).style.display = 'none';
}

// ฟังก์ชันเปิด Modal ทั่วไป
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// ฟังก์ชันจัดการการแสดงผลตาราง
function renderTable(tableId, data, rowGenerator) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    tableBody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = rowGenerator(item);
        tableBody.appendChild(row);
    });
}

// ฟังก์ชันแปลงวันที่ให้อยู่ในรูปแบบที่อ่านง่าย
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH');
}

// ฟังก์ชันแปลงวันที่ให้เป็นรูปแบบที่ input datetime-local รองรับ
function formatDateForInput(dateString) {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toISOString().slice(0, 16); // ตัด Z และมิลลิวินาทีออก
}

// ฟังก์ชันยืนยันการลบหรือดำเนินการที่สำคัญ
function confirmAction(message, onConfirm) {
    // สร้าง HTML สำหรับ Custom Alert Dialog ถ้ายังไม่มี
    if (!document.getElementById('customAlertDialog')) {
        // สร้าง element ใหม่
        const alertOverlay = document.createElement('div');
        alertOverlay.id = 'customAlertDialog';
        alertOverlay.className = 'custom-alert-overlay';

        // สร้าง HTML สำหรับ dialog
        alertOverlay.innerHTML = `
            <div class="custom-alert-container">
                <div class="custom-alert-header">
                    ยืนยันการดำเนินการ
                </div>
                <div class="custom-alert-body" id="customAlertMessage">
                    คุณต้องการดำเนินการนี้หรือไม่?
                </div>
                <div class="custom-alert-actions">
                    <button class="custom-alert-btn custom-alert-btn-cancel" id="customAlertCancel">ยกเลิก</button>
                    <button class="custom-alert-btn custom-alert-btn-confirm" id="customAlertConfirm">ตกลง</button>
                </div>
            </div>
        `;

        // เพิ่ม dialog เข้าไปใน body
        document.body.appendChild(alertOverlay);
    }

    // อ้างอิงถึง elements
    const alertDialog = document.getElementById('customAlertDialog');
    const alertMessage = document.getElementById('customAlertMessage');
    const confirmBtn = document.getElementById('customAlertConfirm');
    const cancelBtn = document.getElementById('customAlertCancel');

    // กำหนดข้อความ
    alertMessage.textContent = message;

    // แสดง dialog
    alertDialog.style.display = 'block';

    // กำหนด event handlers
    const handleConfirm = () => {
        alertDialog.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    };

    const handleCancel = () => {
        alertDialog.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    // เพิ่ม event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}

// ฟังก์ชันโหลดข้อมูลในตัวเลือก dropdown
function loadSelectOptions(selectElement, options, valueField, textField, defaultOption = null) {
    // เก็บตัวเลือกแรก
    selectElement.innerHTML = defaultOption
        ? `<option value="">${defaultOption}</option>`
        : '';

    // เพิ่มตัวเลือกใหม่
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option[valueField];
        optionElement.textContent = option[textField];
        selectElement.appendChild(optionElement);
    });
}