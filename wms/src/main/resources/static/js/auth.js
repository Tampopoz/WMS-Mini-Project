// ไฟล์ JavaScript สำหรับการจัดการการยืนยันตัวตนของผู้ใช้

document.addEventListener('DOMContentLoaded', () => {
    setupAuthForms();
});

function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

function handleLogin(e) {
    e.preventDefault();

    // ไม่จำเป็นต้องตรวจสอบ required เนื่องจากใช้ HTML attributes แล้ว

    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    submitAuthRequest('/api/auth/login', formData, 'login-error', '', true);
}

function handleRegister(e) {
    e.preventDefault();

    // ไม่จำเป็นต้องตรวจสอบ required, minlength และ maxlength เนื่องจากใช้ HTML attributes แล้ว

    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        fullName: document.getElementById('fullName').value,
        role: "ADMIN" // กำหนดค่าคงที่เป็น ADMIN
    };

    submitAuthRequest('/api/auth/register', formData, 'register-error', 'ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ', false);
}

function submitAuthRequest(endpoint, formData, errorElementId, successMessage, isLogin) {
    fetchAPI(endpoint, 'POST', formData)
        .then(data => {
            if (isLogin) {
                // เก็บข้อมูลผู้ใช้ใน localStorage
                localStorage.setItem('username', formData.username);
                if (data.id) localStorage.setItem('userId', data.id);
                if (data.fullName) localStorage.setItem('fullName', data.fullName);
                if (data.role) localStorage.setItem('userRole', data.role);
                localStorage.setItem('loginTime', new Date().toISOString());

                window.location.href = '/index.html';
            } else {
                alert(successMessage);
                window.location.href = '/login.html';
            }
        })
        .catch(error => {
            let errorMessage = '';

            if (isLogin) {
                errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
            } else {
                try {
                    // พยายามแปลง error message จาก JSON string เป็น object
                    const errorObj = typeof error.message === 'string' ? JSON.parse(error.message) : error;

                    // ตรวจสอบว่ามี validation errors หรือไม่
                    if (errorObj.errors && Array.isArray(errorObj.errors)) {
                        // จัดการกับ validation errors แต่ละอัน
                        errorObj.errors.forEach(err => {
                            if (err.field === 'username') {
                                // แสดง error message เฉพาะของ username ในช่อง username-error
                                if (err.codes && err.codes.includes('Size.user.username')) {
                                    showErrorMessage('username-error', 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
                                } else {
                                    showErrorMessage('username-error', 'ชื่อผู้ใช้ไม่ถูกต้อง');
                                }
                            } else if (err.field === 'password') {
                                // แสดง error message เฉพาะของ password ในช่อง password-error
                                showErrorMessage('password-error', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
                            } else if (err.field === 'fullName') {
                                // แสดง error message เฉพาะของ fullName ในช่อง fullName-error
                                showErrorMessage('fullName-error', 'กรุณากรอกชื่อ-นามสกุล');
                            }
                        });

                        // ไม่แสดงข้อความทั่วไปในช่อง register-error
                        errorMessage = '';
                    } else if (error.message && error.message.includes('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว')) {
                        // กรณีชื่อผู้ใช้ซ้ำ
                        showErrorMessage('username-error', 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
                        errorMessage = '';
                    } else if (error.message && error.message.includes('ชื่อ-นามสกุลนี้ถูกใช้งานแล้ว')) {
                        // กรณีชื่อ-นามสกุลซ้ำ
                        showErrorMessage('fullName-error', 'ชื่อ-นามสกุลนี้ถูกใช้งานแล้ว');
                        errorMessage = '';
                    } else {
                        // กรณีไม่ใช่ validation error แต่เป็น error อื่นๆ
                        // แสดงข้อความ error ในช่อง register-error เฉพาะกรณีที่ไม่สามารถระบุได้ว่าเป็น error ของฟิลด์ใด
                        errorMessage = 'ไม่สามารถลงทะเบียนได้: ' + (error.message || '');
                    }
                } catch (e) {
                    // กรณีไม่สามารถแปลง JSON ได้
                    errorMessage = 'ไม่สามารถลงทะเบียนได้: ' + (error.message || '');
                }
            }

            // แสดงข้อความ error ทั่วไปเฉพาะเมื่อมีข้อความ error
            if (errorMessage) {
                showErrorMessage(errorElementId, errorMessage);
            } else {
                // ซ่อนข้อความ error ทั่วไปเมื่อไม่มีข้อความ error
                document.getElementById(errorElementId).style.display = 'none';
            }
        });
}
