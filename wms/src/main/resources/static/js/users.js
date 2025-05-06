// JavaScript สำหรับการจัดการผู้ใช้งานในระบบคลังสินค้า

// รอให้เอกสารโหลดเสร็จก่อนจึงทำงาน
document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบเซสชันผู้ใช้และสิทธิ์การเข้าถึง
    checkSession(
        userData => {
            // ตรวจสอบว่าผู้ใช้เป็นผู้ดูแลระบบหรือไม่
            if (userData.role !== 'ADMIN') {
                window.location.href = '/index.html';
                return;
            }

            // โหลดข้อมูลและตั้งค่า event listeners
            loadUsers();
            setupUserForms();
        },
        null,
        true // ต้องเป็นผู้ดูแลระบบเท่านั้น
    );
});

// ตั้งค่า event listeners สำหรับฟอร์มจัดการผู้ใช้
function setupUserForms() {
    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }

    const editUserForm = document.getElementById('edit-user-form');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
    }
}

// โหลดข้อมูลผู้ใช้ทั้งหมด
function loadUsers() {
    fetchAPI('/api/users')
        .then(users => {
            renderUsersTable(users);
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:', error);
        });
}

// แสดงข้อมูลผู้ใช้ในตาราง
function renderUsersTable(users) {
    const tableBody = document.querySelector('#users-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td>${user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'พนักงานคลังสินค้า'}</td>
            <td>
                <button class="btn" onclick="editUser(${user.id})">แก้ไข</button>
                <button class="btn btn-danger" onclick="deleteUser(${user.id})">ลบ</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// จัดการการส่งฟอร์มเพิ่มผู้ใช้
function handleAddUser(e) {
    e.preventDefault();

    // ไม่จำเป็นต้องตรวจสอบ required, minlength และ maxlength เนื่องจากใช้ HTML attributes แล้ว

    // สร้างข้อมูลผู้ใช้จากฟอร์ม
    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        fullName: document.getElementById('fullName').value,
        role: "EMPLOYEE" // กำหนดค่าคงที่เป็น EMPLOYEE
    };

    // ส่งคำขอลงทะเบียนผู้ใช้ใหม่
    fetchAPI('/api/auth/register', 'POST', formData)
        .then(data => {
            document.getElementById('add-user-form').reset();
            loadUsers();
            alert('เพิ่มผู้ใช้งานสำเร็จ');
        })
        .catch(error => {
            showErrorMessage('add-user-error', 'ไม่สามารถเพิ่มผู้ใช้งานได้: ' + error.message);
        });
}

// เตรียมฟอร์มสำหรับแก้ไขผู้ใช้
function editUser(userId) {
    fetchAPI(`/api/users/${userId}`)
        .then(user => {
            populateEditUserForm(user);
            openModal('edit-user-modal');
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:', error);
            alert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        });
}

// กรอกข้อมูลในฟอร์มแก้ไขผู้ใช้
function populateEditUserForm(user) {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-username').value = user.username;
    document.getElementById('edit-fullName').value = user.fullName;
    document.getElementById('edit-role').value = user.role;
    // ไม่กรอกรหัสผ่านเพื่อความปลอดภัย
    document.getElementById('edit-password').value = '';
}

// จัดการการส่งฟอร์มแก้ไขผู้ใช้
function handleEditUser(e) {
    e.preventDefault();

    // ไม่จำเป็นต้องตรวจสอบ required, minlength และ maxlength เนื่องจากใช้ HTML attributes แล้ว

    // ล้างข้อความข้อผิดพลาดเดิม
    clearErrorMessage('edit-username-error');
    clearErrorMessage('edit-fullName-error');
    clearErrorMessage('edit-user-error');

    // ดึงค่าจากฟอร์ม
    const username = document.getElementById('edit-username').value;
    const fullName = document.getElementById('edit-fullName').value;

    const userId = document.getElementById('edit-user-id').value;

    // สร้างข้อมูลผู้ใช้จากฟอร์ม
    const formData = {
        username: username,
        fullName: fullName,
        role: document.getElementById('edit-role').value
    };

    // เพิ่มรหัสผ่านเฉพาะเมื่อมีการกรอก
    const password = document.getElementById('edit-password').value;
    if (password) {
        formData.password = password;
    }

    // ส่งคำขอแก้ไขผู้ใช้
    fetchAPI(`/api/users/${userId}`, 'PUT', formData)
        .then(data => {
            closeEditModal();
            loadUsers();
            alert('แก้ไขข้อมูลผู้ใช้สำเร็จ');
        })
        .catch(error => {
            showErrorMessage('edit-user-error', 'ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้: ' + error.message);
        });
}

// ปิดหน้าต่าง modal แก้ไขผู้ใช้
function closeEditModal() {
    closeModal('edit-user-modal', 'edit-user-form', 'edit-user-error');
}

// ลบผู้ใช้
function deleteUser(userId) {
    confirmAction('คุณต้องการลบผู้ใช้นี้หรือไม่?', () => {
        fetchAPI(`/api/users/${userId}`, 'DELETE')
            .then(() => {
                loadUsers();
                alert('ลบผู้ใช้สำเร็จ');
            })
            .catch(error => {
                console.error('เกิดข้อผิดพลาดในการลบผู้ใช้:', error);
                alert('ไม่สามารถลบผู้ใช้ได้');
            });
    });
}