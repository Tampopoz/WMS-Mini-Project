// JavaScript สำหรับการจัดการตำแหน่งจัดเก็บในคลังสินค้า

// สร้างโครงสร้างข้อมูลสำหรับเก็บข้อมูลคลังสินค้า
const WAREHOUSE_CONFIG = {
    // จำนวนแถวในแต่ละโซน
    defaultRows: [1, 2, 3, 4, 5],
    // จำนวนตำแหน่งในแต่ละแถว
    defaultPositions: [1, 2, 3, 4, 5, 6]
};

// สร้างโครงสร้างข้อมูลสำหรับคลังสินค้า
const WAREHOUSE_DATA = {};

// สร้างโครงสร้างข้อมูลสำหรับโซน A-Z
function initializeWarehouseData() {
    // สร้างโซน A-Z
    for (let charCode = 65; charCode <= 90; charCode++) {
        const zoneName = String.fromCharCode(charCode);

        WAREHOUSE_DATA[zoneName] = {
            name: `โซน ${zoneName}`,
            rows: WAREHOUSE_CONFIG.defaultRows.slice(),
            positions: {}
        };

        // สร้างตำแหน่งสำหรับแต่ละแถว
        WAREHOUSE_CONFIG.defaultRows.forEach(row => {
            WAREHOUSE_DATA[zoneName].positions[row] = WAREHOUSE_CONFIG.defaultPositions.slice();
        });
    }
}

// รอให้เอกสารโหลดเสร็จก่อนจึงทำงาน
document.addEventListener('DOMContentLoaded', () => {
    // สร้างโครงสร้างข้อมูลคลังสินค้า
    initializeWarehouseData();

    // ตรวจสอบเซสชันผู้ใช้
    checkSession(() => {
        // โหลดข้อมูลและตั้งค่า event listeners
        loadLocations();
        setupFormListeners();
        populateZoneDropdowns(); // เติมตัวเลือกโซน A-Z ในดรอปดาวน์

        // ตั้งค่าการโหลดข้อมูลตำแหน่งซ้ำทุก 30 วินาที
        setInterval(loadLocations, 30000);
    });
});

// ฟังก์ชันเติมตัวเลือกโซน (A-Z) ในดรอปดาวน์
function populateZoneDropdowns() {
    const zoneSelects = [
        document.getElementById('zone'),
        document.getElementById('edit-zone')
    ];

    // วนลูปผ่านทุกดรอปดาวน์
    zoneSelects.forEach(select => {
        if (!select) return;

        // ล้างตัวเลือกเดิมและเพิ่มตัวเลือกแรก
        select.innerHTML = '<option value="">-- เลือกโซน --</option>';

        // เพิ่มตัวเลือกโซน A-Z
        for (let charCode = 65; charCode <= 90; charCode++) {
            const zoneName = String.fromCharCode(charCode);
            const option = document.createElement('option');
            option.value = zoneName;
            option.textContent = `โซน ${zoneName}`;
            select.appendChild(option);
        }
    });
}

// ตั้งค่า event listeners สำหรับฟอร์มต่างๆ
function setupFormListeners() {
    setupAddLocationForm();
    setupEditLocationForm();
}

// ตั้งค่า event listeners สำหรับฟอร์มเพิ่มตำแหน่ง
function setupAddLocationForm() {
    const form = document.getElementById('add-location-form');
    if (!form) return;

    form.addEventListener('submit', handleAddLocation);

    // ตั้งค่า event listeners สำหรับการเลือกตำแหน่ง
    document.getElementById('zone').addEventListener('change', () => updateOptions('zone', 'row', 'position'));
    document.getElementById('row').addEventListener('change', () => updatePositionOptions('row', 'position'));
    document.getElementById('level').addEventListener('change', () => generateLocationName());
    document.getElementById('position').addEventListener('change', () => generateLocationName());
}

// ตั้งค่า event listeners สำหรับฟอร์มแก้ไขตำแหน่ง
function setupEditLocationForm() {
    const form = document.getElementById('edit-location-form');
    if (!form) return;

    form.addEventListener('submit', handleEditLocation);

    // ตั้งค่า event listeners สำหรับการเลือกตำแหน่ง
    document.getElementById('edit-zone').addEventListener('change', () => updateOptions('edit-zone', 'edit-row', 'edit-position', true));
    document.getElementById('edit-row').addEventListener('change', () => updatePositionOptions('edit-row', 'edit-position', true));
    document.getElementById('edit-level').addEventListener('change', () => generateLocationName(true));
    document.getElementById('edit-position').addEventListener('change', () => generateLocationName(true));
}

// อัปเดตตัวเลือกแถวตามโซนที่เลือก
function updateOptions(zoneId, rowId, positionId, isEditForm = false) {
    const zoneSelect = document.getElementById(zoneId);
    const rowSelect = document.getElementById(rowId);
    const selectedZone = zoneSelect.value;

    // ล้างตัวเลือกแถวเดิม
    rowSelect.innerHTML = '<option value="">-- เลือกแถว --</option>';

    // ถ้าไม่ได้เลือกโซน ให้จบการทำงาน
    if (!selectedZone) return;

    // เพิ่มตัวเลือกแถวตามโซนที่เลือก (เรียงจากน้อยไปมาก)
    const rows = WAREHOUSE_DATA[selectedZone].rows.slice().sort((a, b) => a - b);
    rows.forEach(row => {
        const option = document.createElement('option');
        option.value = row;
        option.textContent = `แถว ${row}`;
        rowSelect.appendChild(option);
    });

    // ล้างตัวเลือกตำแหน่ง
    document.getElementById(positionId).innerHTML = '<option value="">-- เลือกตำแหน่ง --</option>';

    // อัปเดตชื่อตำแหน่ง
    generateLocationName(isEditForm);
}

// อัปเดตตัวเลือกตำแหน่งตามโซนและแถวที่เลือก
function updatePositionOptions(rowId, positionId, isEditForm = false) {
    const prefix = isEditForm ? 'edit-' : '';
    const zoneSelect = document.getElementById(prefix + 'zone');
    const rowSelect = document.getElementById(rowId);
    const positionSelect = document.getElementById(positionId);

    const selectedZone = zoneSelect.value;
    const selectedRow = rowSelect.value;

    // ล้างตัวเลือกตำแหน่งเดิม
    positionSelect.innerHTML = '<option value="">-- เลือกตำแหน่ง --</option>';

    // ถ้าไม่ได้เลือกโซนหรือแถว ให้จบการทำงาน
    if (!selectedZone || !selectedRow) return;

    // เพิ่มตัวเลือกตำแหน่งตามโซนและแถวที่เลือก (เรียงจากน้อยไปมาก)
    const positions = WAREHOUSE_DATA[selectedZone].positions[selectedRow].slice().sort((a, b) => a - b);
    positions.forEach(position => {
        const option = document.createElement('option');
        option.value = position;
        option.textContent = `ตำแหน่ง ${position}`;
        positionSelect.appendChild(option);
    });

    // อัปเดตชื่อตำแหน่ง
    generateLocationName(isEditForm);
}

// สร้างชื่อตำแหน่งอัตโนมัติ
function generateLocationName(isEditForm = false) {
    const prefix = isEditForm ? 'edit-' : '';
    const zone = document.getElementById(prefix + 'zone').value;
    const row = document.getElementById(prefix + 'row').value;
    const level = document.getElementById(prefix + 'level').value;
    const position = document.getElementById(prefix + 'position').value;

    // หากเลือกครบทุกส่วน ให้สร้างชื่อตำแหน่ง
    if (zone && row && level && position) {
        document.getElementById(prefix + 'name').value = `${zone}${row}${level}${position}`;
    } else {
        document.getElementById(prefix + 'name').value = '';
    }
}

// โหลดข้อมูลตำแหน่งจัดเก็บทั้งหมด และปรับปรุงข้อมูลการใช้งานกับสินค้า
function loadLocations() {
    // ดึงข้อมูลสินค้าและตำแหน่งแบบขนาน
    Promise.all([
        fetchAPI('/api/products'),
        fetchAPI('/api/locations')
    ])
        .then(([products, locations]) => {
            // อัปเดตข้อมูลการใช้งานของตำแหน่งตามข้อมูลสินค้า
            return syncLocationUtilization(locations, products)
                .then(updatedLocations => {
                    // อัปเดตสถิติและแสดงข้อมูล
                    updateLocationsStats(updatedLocations);
                    renderLocationsTable(updatedLocations);
                });
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลตำแหน่งจัดเก็บ:', error);
        });
}

// ซิงค์ข้อมูลการใช้งานตำแหน่งกับสินค้า
function syncLocationUtilization(locations, products) {
    // สร้าง Map ของตำแหน่งเพื่อง่ายต่อการค้นหา
    const locationMap = new Map();
    locations.forEach(location => {
        locationMap.set(location.name, location);
        // ไม่รีเซ็ตค่าการใช้งานเป็น 0 อีกต่อไป เพื่อรักษาค่าจากฐานข้อมูล
    });

    // คำนวณการใช้งานจากข้อมูลสินค้า
    const calculatedUtilization = new Map();
    products.forEach(product => {
        if (product.location) {
            const currentValue = calculatedUtilization.get(product.location) || 0;
            calculatedUtilization.set(product.location, currentValue + product.quantity);
        }
    });

    // ตรวจสอบความสอดคล้องของข้อมูลและอัปเดตฐานข้อมูลถ้าจำเป็น
    const updatePromises = [];

    locationMap.forEach((location, locationName) => {
        const calculatedValue = calculatedUtilization.get(locationName) || 0;

        // ถ้าค่าที่คำนวณได้แตกต่างจากค่าในฐานข้อมูล
        if (calculatedValue !== location.currentUtilization) {
            console.warn(`พบความไม่สอดคล้องของข้อมูลการใช้งานตำแหน่ง ${locationName}: ค่าในฐานข้อมูล = ${location.currentUtilization}, ค่าที่คำนวณจากสินค้า = ${calculatedValue}`);

            // อัปเดตค่าในฐานข้อมูลให้ตรงกับค่าที่คำนวณจากสินค้า
            const updatedLocation = {...location};
            updatedLocation.currentUtilization = calculatedValue;

            // อัปเดตค่าในออบเจ็กต์ location เพื่อใช้ในการแสดงผลทันที
            location.currentUtilization = calculatedValue;

            // ส่งคำขออัปเดตไปยังเซิร์ฟเวอร์
            updatePromises.push(
                fetchAPI(`/api/locations/${location.id}`, 'PUT', updatedLocation)
                    .then(() => {
                        console.log(`อัปเดตค่าการใช้งานของตำแหน่ง ${locationName} เป็น ${calculatedValue} สำเร็จ`);
                    })
                    .catch(error => {
                        console.error(`เกิดข้อผิดพลาดในการอัปเดตค่าการใช้งานของตำแหน่ง ${locationName}:`, error);
                        // กรณีอัปเดตไม่สำเร็จ ให้คืนค่าเดิม
                        location.currentUtilization = updatedLocation.currentUtilization;
                    })
            );
        }
    });

    // คำนวณค่า availableCapacity
    locations.forEach(location => {
        location.availableCapacity = Math.max(0, location.capacity - location.currentUtilization);
        location.available = location.availableCapacity > 0 && location.status === 'พร้อมใช้งาน';
    });

    // ถ้ามีการอัปเดตฐานข้อมูล ให้รอให้การอัปเดตเสร็จสิ้นก่อนส่งคืนข้อมูล
    if (updatePromises.length > 0) {
        return Promise.all(updatePromises)
            .then(() => {
                console.log(`อัปเดตค่าการใช้งานของตำแหน่งทั้งหมด ${updatePromises.length} ตำแหน่งสำเร็จ`);
                return locations;
            })
            .catch(error => {
                console.error('เกิดข้อผิดพลาดในการอัปเดตค่าการใช้งานของตำแหน่ง:', error);
                return locations;
            });
    }

    return Promise.resolve(locations);
}

// อัปเดตข้อมูลสถิติตำแหน่งจัดเก็บใน LocalStorage
function updateLocationsStats(locations) {
    // นับจำนวนตำแหน่งทั้งหมด
    const totalLocations = locations.length;

    // นับจำนวนตำแหน่งที่ว่าง
    const availableLocations = locations.filter(location =>
        location.available && location.status === 'พร้อมใช้งาน').length;

    // ใช้ฟังก์ชัน utility ที่เพิ่มเข้ามาใน main.js
    saveLocationStats(totalLocations, totalLocations - availableLocations, availableLocations);
}

// แสดงข้อมูลตำแหน่งจัดเก็บในตาราง
function renderLocationsTable(locations) {
    const tableBody = document.querySelector('#locations-table tbody');
    tableBody.innerHTML = '';

    // เรียงลำดับตามชื่อตำแหน่ง
    locations.sort((a, b) => a.name.localeCompare(b.name));

    locations.forEach(location => {
        const row = document.createElement('tr');

        if (location.available) {
            row.style.backgroundColor = '#e6ffe6';
        }

        // หาค่าแถวจากชื่อตำแหน่ง (ถ้าไม่มีค่าแถวโดยตรง)
        let rowValue = '-';
        const locationParts = parseLocationName(location.name);
        if (locationParts) {
            rowValue = locationParts.row;
        } else if (location.row) {
            rowValue = location.row;
        }

        row.innerHTML = `
            <td>${location.name}</td>
            <td>${location.type || '-'}</td>
            <td>${location.section || '-'}</td>
            <td>${rowValue}</td>
            <td>${location.level || '-'}</td>
            <td>${location.position || '-'}</td>
            <td>${location.capacity}</td>
            <td>${location.currentUtilization}</td>
            <td>${location.availableCapacity}</td>
            <td>${location.status || 'พร้อมใช้งาน'}</td>
            <td>
                <button class="btn" onclick="editLocation(${location.id})">แก้ไข</button>
                <button class="btn btn-danger" onclick="deleteLocation(${location.id})">ลบ</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ค้นหาตำแหน่งจัดเก็บตามคำค้น
function searchLocations() {
    const keyword = document.getElementById('search-keyword').value.trim();

    if (!keyword) {
        loadLocations();
        return;
    }

    fetchAPI(`/api/locations/search?keyword=${encodeURIComponent(keyword)}`)
        .then(locations => {
            // ต้องโหลดข้อมูลสินค้าเพื่ออัปเดตการใช้งานตำแหน่ง
            return fetchAPI('/api/products').then(products => {
                return syncLocationUtilization(locations, products)
                    .then(updatedLocations => {
                        renderLocationsTable(updatedLocations);
                    });
            });
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการค้นหาตำแหน่งจัดเก็บ:', error);
        });
}

// แสดงเฉพาะตำแหน่งจัดเก็บที่ว่าง
function showAvailableOnly() {
    fetchAPI('/api/locations/available')
        .then(locations => {
            // ต้องโหลดข้อมูลสินค้าเพื่ออัปเดตการใช้งานตำแหน่ง
            return fetchAPI('/api/products').then(products => {
                return syncLocationUtilization(locations, products)
                    .then(updatedLocations => {
                        renderLocationsTable(updatedLocations);
                    });
            });
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลตำแหน่งว่าง:', error);
        });
}

// เพิ่มฟังก์ชันสำหรับตรวจสอบชื่อตำแหน่งซ้ำในฝั่ง client
function checkDuplicateLocationName(name, excludeId = null) {
    return new Promise((resolve, reject) => {
        fetchAPI('/api/locations')
            .then(locations => {
                // กรองตำแหน่งที่มีชื่อเดียวกัน (ยกเว้นตำแหน่งที่กำลังแก้ไข)
                const duplicate = locations.find(loc =>
                    loc.name === name && (excludeId === null || loc.id !== excludeId)
                );

                if (duplicate) {
                    reject(new Error(`ตำแหน่งที่มีชื่อ '${name}' มีอยู่แล้ว ไม่สามารถสร้างซ้ำได้`));
                } else {
                    resolve();
                }
            })
            .catch(error => {
                console.error('เกิดข้อผิดพลาดในการตรวจสอบชื่อตำแหน่ง:', error);
                // ให้ผ่านไปเพื่อให้ server ตรวจสอบอีกครั้ง
                resolve();
            });
    });
}

// จัดการการส่งฟอร์มเพิ่มตำแหน่งจัดเก็บ
function handleAddLocation(e) {
    e.preventDefault();

    const validationRules = {
        name: [{ type: 'required', message: 'กรุณากรอกชื่อตำแหน่ง' }],
        zone: [{ type: 'required', message: 'กรุณาเลือกโซน' }],
        row: [{ type: 'required', message: 'กรุณาเลือกแถว' }],
        level: [{ type: 'required', message: 'กรุณาเลือกชั้น' }],
        position: [{ type: 'required', message: 'กรุณาเลือกตำแหน่ง' }],
        capacity: [
            { type: 'required', message: 'กรุณากรอกความจุ' },
            { type: 'min', value: 0, message: 'ความจุต้องไม่น้อยกว่า 0' }
        ],
        currentUtilization: [
            { type: 'required', message: 'กรุณากรอกจำนวนที่ใช้ไปแล้ว' },
            { type: 'min', value: 0, message: 'จำนวนที่ใช้ไปแล้วต้องไม่น้อยกว่า 0' }
        ]
    };

    if (!validateForm('add-location-form', validationRules)) {
        return;
    }

    // ตรวจสอบว่าจำนวนที่ใช้ไปแล้วไม่เกินความจุ
    const capacity = parseInt(document.getElementById('capacity').value);
    const currentUtilization = parseInt(document.getElementById('currentUtilization').value);

    if (currentUtilization > capacity) {
        showErrorMessage('currentUtilization-error', 'จำนวนที่ใช้ไปแล้วต้องไม่เกินความจุ');
        return;
    }

    // สร้างข้อมูลจากฟอร์ม
    const formData = {
        name: document.getElementById('name').value,
        type: document.getElementById('type').value,
        section: document.getElementById('zone').value,
        row: document.getElementById('row').value,
        level: document.getElementById('level').value,
        position: document.getElementById('position').value,
        capacity: capacity,
        currentUtilization: currentUtilization,
        status: document.getElementById('status').value
    };

    // ตรวจสอบชื่อซ้ำในฝั่ง client ก่อนส่งข้อมูลไปยังเซิร์ฟเวอร์
    checkDuplicateLocationName(formData.name)
        .then(() => {
            // ถ้าไม่ซ้ำ จึงส่งข้อมูลไปยังเซิร์ฟเวอร์
            return fetchAPI('/api/locations', 'POST', formData);
        })
        .then(data => {
            // รีเซ็ตฟอร์มและโหลดข้อมูลใหม่
            document.getElementById('add-location-form').reset();
            resetDropdowns(['row', 'position']);
            loadLocations();
            alert('เพิ่มตำแหน่งจัดเก็บสำเร็จ');
        })
        .catch(error => {
            showErrorMessage('add-location-error', 'ไม่สามารถเพิ่มตำแหน่งจัดเก็บได้: ' + error.message);
        });
}

// รีเซ็ตดร็อปดาวน์ให้กลับไปเป็นตัวเลือกว่างเปล่า
function resetDropdowns(dropdownIds) {
    dropdownIds.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">-- เลือก' + (id === 'row' ? 'แถว' : 'ตำแหน่ง') + ' --</option>';
        }
    });
}

// เตรียมฟอร์มสำหรับแก้ไขตำแหน่งจัดเก็บ
function editLocation(locationId) {
    // ดึงข้อมูลตำแหน่งพร้อมกับข้อมูลสินค้าเพื่ออัปเดตการใช้งาน
    Promise.all([
        fetchAPI(`/api/locations/${locationId}`),
        fetchAPI('/api/products')
    ])
        .then(([location, products]) => {
            // คำนวณการใช้งานจากข้อมูลสินค้า
            const productsAtLocation = products.filter(p => p.location === location.name);
            const calculatedUtilization = productsAtLocation.reduce((sum, p) => sum + p.quantity, 0);

            // ตรวจสอบความสอดคล้องของข้อมูล
            if (calculatedUtilization !== location.currentUtilization) {
                console.warn(`พบความไม่สอดคล้องของข้อมูลการใช้งานตำแหน่ง ${location.name}: ค่าในฐานข้อมูล = ${location.currentUtilization}, ค่าที่คำนวณจากสินค้า = ${calculatedUtilization}`);

                // ใช้ค่าที่คำนวณจากสินค้าเป็นหลัก
                location.currentUtilization = calculatedUtilization;

                // อัปเดตค่าในฐานข้อมูล
                fetchAPI(`/api/locations/${location.id}`, 'PUT', location)
                    .then(() => {
                        console.log(`อัปเดตค่าการใช้งานของตำแหน่ง ${location.name} เป็น ${calculatedUtilization} สำเร็จ`);
                    })
                    .catch(error => {
                        console.error(`เกิดข้อผิดพลาดในการอัปเดตค่าการใช้งานของตำแหน่ง ${location.name}:`, error);
                    });
            }

            location.availableCapacity = Math.max(0, location.capacity - location.currentUtilization);

            populateEditLocationForm(location);
            openModal('edit-location-modal');
        })
        .catch(error => {
            alert('ไม่สามารถโหลดข้อมูลตำแหน่งจัดเก็บได้');
        });
}

// กรอกข้อมูลในฟอร์มแก้ไข
function populateEditLocationForm(location) {
    document.getElementById('edit-location-id').value = location.id;

    // แยกส่วนประกอบของชื่อตำแหน่ง
    const locationParts = parseLocationName(location.name);

    if (locationParts) {
        // ถ้าแยกส่วนประกอบสำเร็จ ให้เลือกค่าตามส่วนประกอบ
        document.getElementById('edit-zone').value = locationParts.zone;
        updateOptions('edit-zone', 'edit-row', 'edit-position', true);

        document.getElementById('edit-row').value = locationParts.row;
        updatePositionOptions('edit-row', 'edit-position', true);

        document.getElementById('edit-level').value = locationParts.level;
        document.getElementById('edit-position').value = locationParts.position;
        document.getElementById('edit-name').value = location.name;
    } else {
        // ถ้าแยกส่วนประกอบไม่สำเร็จ ให้กรอกข้อมูลตามปกติ
        document.getElementById('edit-name').value = location.name;
        document.getElementById('edit-zone').value = location.section || '';
        document.getElementById('edit-row').value = location.row || '';
        document.getElementById('edit-level').value = location.level || '';
    }

    // กรอกข้อมูลอื่นๆ
    document.getElementById('edit-type').value = location.type || '';
    document.getElementById('edit-capacity').value = location.capacity;
    document.getElementById('edit-currentUtilization').value = location.currentUtilization;
    document.getElementById('edit-status').value = location.status || 'พร้อมใช้งาน';

    // เก็บค่าการใช้งานเดิมไว้เพื่อเปรียบเทียบเมื่อมีการแก้ไข
    document.getElementById('edit-location-form').setAttribute('data-original-utilization', location.currentUtilization);
}

// แยกส่วนประกอบของชื่อตำแหน่ง
function parseLocationName(name) {
    // รูปแบบชื่อตำแหน่ง: [A-Z][0-9][0-9][0-9] เช่น A123
    const regex = /([A-Z])(\d)(\d)(\d)/;
    const match = name.match(regex);

    if (match) {
        return {
            zone: match[1],
            row: match[2],
            level: match[3],
            position: match[4]
        };
    }

    return null;
}

// จัดการการส่งฟอร์มแก้ไขตำแหน่งจัดเก็บ
function handleEditLocation(e) {
    e.preventDefault();

    const locationId = document.getElementById('edit-location-id').value;
    const capacity = parseInt(document.getElementById('edit-capacity').value);
    const currentUtilization = parseInt(document.getElementById('edit-currentUtilization').value);
    const originalUtilization = parseInt(e.target.getAttribute('data-original-utilization') || 0);

    // ตรวจสอบว่าจำนวนที่ใช้ไปแล้วไม่เกินความจุ
    if (currentUtilization > capacity) {
        showErrorMessage('edit-currentUtilization-error', 'จำนวนที่ใช้ไปแล้วต้องไม่เกินความจุ');
        return;
    }

    // สร้างข้อมูลจากฟอร์ม
    const formData = {
        name: document.getElementById('edit-name').value,
        type: document.getElementById('edit-type').value,
        section: document.getElementById('edit-zone').value,
        row: document.getElementById('edit-row').value,
        level: document.getElementById('edit-level').value,
        position: document.getElementById('edit-position').value,
        capacity: capacity,
        currentUtilization: currentUtilization,
        status: document.getElementById('edit-status').value
    };

    // ตรวจสอบว่าการใช้งานตำแหน่งเปลี่ยนแปลงหรือไม่
    const utilizationChanged = currentUtilization !== originalUtilization;

    // ตรวจสอบชื่อซ้ำในฝั่ง client ก่อนส่งข้อมูลไปยังเซิร์ฟเวอร์
    checkDuplicateLocationName(formData.name, parseInt(locationId))
        .then(() => {
            // ถ้าการใช้งานตำแหน่งเปลี่ยนแปลง ให้ตรวจสอบความสอดคล้องกับข้อมูลสินค้า
            if (utilizationChanged) {
                return validateUtilizationWithProducts(formData.name, currentUtilization)
                    .then(isValid => {
                        if (!isValid) {
                            // ถ้าไม่สอดคล้อง ให้ถามผู้ใช้ว่าต้องการดำเนินการต่อหรือไม่
                            if (!confirm('ค่าการใช้งานที่กรอกไม่ตรงกับข้อมูลสินค้าจริง ต้องการดำเนินการต่อหรือไม่?')) {
                                throw new Error('ยกเลิกการแก้ไขโดยผู้ใช้');
                            }
                        }
                        // ส่งคำขอแก้ไข
                        return fetchAPI(`/api/locations/${locationId}`, 'PUT', formData);
                    });
            }
            // ส่งคำขอแก้ไข
            return fetchAPI(`/api/locations/${locationId}`, 'PUT', formData);
        })
        .then(data => {
            closeEditModal();
            loadLocations();
            alert('แก้ไขข้อมูลตำแหน่งจัดเก็บสำเร็จ');
        })
        .catch(error => {
            showErrorMessage('edit-location-error', 'ไม่สามารถแก้ไขข้อมูลตำแหน่งจัดเก็บได้: ' + error.message);
        });
}

// ตรวจสอบความสอดคล้องของค่าการใช้งานกับข้อมูลสินค้า
function validateUtilizationWithProducts(locationName, utilization) {
    return fetchAPI('/api/products')
        .then(products => {
            // กรองเฉพาะสินค้าที่อยู่ในตำแหน่งนี้
            const productsInLocation = products.filter(p => p.location === locationName);

            // คำนวณการใช้งานจากข้อมูลสินค้า
            const calculatedUtilization = productsInLocation.reduce((sum, p) => sum + p.quantity, 0);

            // ตรวจสอบว่าค่าที่กรอกตรงกับค่าที่คำนวณจากสินค้าหรือไม่
            return calculatedUtilization === utilization;
        });
}

// ลบตำแหน่งจัดเก็บ
function deleteLocation(locationId) {
    confirmAction('คุณต้องการลบตำแหน่งจัดเก็บนี้หรือไม่?', () => {
        // ดึงข้อมูลตำแหน่งก่อนลบเพื่อตรวจสอบว่ามีสินค้าอยู่หรือไม่
        fetchAPI(`/api/locations/${locationId}`)
            .then(location => {
                // ตรวจสอบว่ามีสินค้าในตำแหน่งนี้หรือไม่
                return fetchAPI('/api/products')
                    .then(products => {
                        const productsInLocation = products.filter(p => p.location === location.name);

                        // ถ้ามีสินค้าในตำแหน่งนี้ ไม่อนุญาตให้ลบ
                        if (productsInLocation.length > 0) {
                            throw new Error('ไม่สามารถลบตำแหน่งที่มีสินค้าอยู่ได้ กรุณาย้ายสินค้าออกก่อน');
                        }

                        // ถ้าไม่มีสินค้า ทำการลบตำแหน่ง
                        return fetchAPI(`/api/locations/${locationId}`, 'DELETE');
                    });
            })
            .then(() => {
                loadLocations();
                alert('ลบตำแหน่งจัดเก็บสำเร็จ');
            })
            .catch(error => {
                console.error('เกิดข้อผิดพลาดในการลบตำแหน่งจัดเก็บ:', error);
                alert('ไม่สามารถลบตำแหน่งจัดเก็บได้: ' + (error.message || 'กรุณาตรวจสอบว่าตำแหน่งนี้ไม่มีสินค้าอยู่'));
            });
    });
}
