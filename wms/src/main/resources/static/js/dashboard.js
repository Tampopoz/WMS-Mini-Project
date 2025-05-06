// JavaScript สำหรับหน้าแดชบอร์ด

document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบเซสชันผู้ใช้
    checkSession(userData => {
        // ตรวจสอบสิทธิ์ของผู้ใช้และแสดงส่วนที่เกี่ยวข้อง
        setupAdminFeatures(userData);

        // โหลดข้อมูลสำหรับแดชบอร์ดแบบขนาน
        loadAllDashboardData();

        // ตั้งค่า event listeners และการอัปเดตตามเวลา
        setupEventListenersAndPolling();
    });
});

// ตั้งค่า event listeners และการอัปเดตตามเวลา
function setupEventListenersAndPolling() {
    // รับฟังเหตุการณ์การอัปเดตข้อมูลตำแหน่งจัดเก็บ
    document.addEventListener('wms_locations_updated', () => {
        updateLocationStats();
    });

    // ตรวจสอบข้อมูลทุก 5 วินาที
    setInterval(checkForUpdates, 5000);
}

// ตรวจสอบการอัปเดตข้อมูลใหม่
function checkForUpdates() {
    const lastUpdated = localStorage.getItem('wms_locations_last_updated');
    if (lastUpdated) {
        updateLocationStats();
    }
}

// อัปเดตข้อมูลสถิติตำแหน่งจัดเก็บจาก LocalStorage
function updateLocationStats() {
    const totalLocations = localStorage.getItem('wms_total_locations') || 0;
    const availableLocations = localStorage.getItem('wms_available_locations') || 0;

    document.getElementById('total-locations').textContent = totalLocations;
    document.getElementById('available-locations').textContent = availableLocations;
}

// โหลดข้อมูลทั้งหมดที่จะแสดงบนแดชบอร์ด
function loadAllDashboardData() {
    // โหลดข้อมูลทั้งหมดพร้อมกัน
    Promise.all([
        fetchAPI('/api/products'),
        fetchAPI('/api/locations'),
        fetchAPI('/api/locations/count'),
        fetchAPI('/api/inbound/recent'),
        fetchAPI('/api/outbound/recent')
    ])
        .then(([products, locations, locationStats, inboundLogs, outboundLogs]) => {
            // อัปเดตข้อมูลสินค้า
            updateProductStats(products);
            updateLowStockAlerts(products);

            // สร้าง Set ของตำแหน่งที่มีสินค้าใช้งาน
            const usedLocationNames = new Set();
            products.forEach(product => {
                if (product.location) {
                    usedLocationNames.add(product.location);
                }
            });

            // กรองเฉพาะตำแหน่งที่ว่าง (มีพื้นที่เหลือและพร้อมใช้งาน)
            const availableLocations = locations.filter(location =>
                location.currentUtilization < location.capacity &&
                location.status === 'พร้อมใช้งาน'
            );

            // อัปเดตข้อมูลตำแหน่งจัดเก็บ
            const totalLocations = locationStats.total || 0;
            const availableLocationsCount = availableLocations.length;

            // บันทึกข้อมูลลง localStorage
            saveLocationStats(totalLocations, totalLocations - availableLocationsCount, availableLocationsCount);

            // แสดงข้อมูลตำแหน่ง
            document.getElementById('total-locations').textContent = totalLocations;
            document.getElementById('available-locations').textContent = availableLocationsCount;

            // อัปเดตข้อมูลการรับสินค้าล่าสุด
            updateRecentInboundSection(inboundLogs);

            // อัปเดตข้อมูลการส่งออกสินค้าล่าสุด
            updateRecentOutboundSection(outboundLogs);
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด:', error);
            // ใช้ข้อมูลจาก LocalStorage กรณีโหลดไม่สำเร็จ
            updateLocationStats();
        });
}

// อัปเดตสถิติสินค้า
function updateProductStats(products) {
    // แสดงจำนวนสินค้าทั้งหมด
    document.getElementById('total-products').textContent = products.length;

    // กรองสินค้าที่มีจำนวนใกล้หมด
    const lowStockProducts = products.filter(p => p.lowStock);
    document.getElementById('low-stock-products').textContent = lowStockProducts.length;
}

// อัปเดตการแจ้งเตือนสินค้าใกล้หมด
function updateLowStockAlerts(products) {
    const lowStockProducts = products.filter(p => p.lowStock);
    const alertsContainer = document.getElementById('alerts-container');

    // ล้างรายการเดิม
    if (alertsContainer) {
        // แสดงข้อความหรือรายการตามสถานการณ์
        if (lowStockProducts.length === 0) {
            alertsContainer.classList.add('empty');
            alertsContainer.innerHTML = '<p>ไม่มีการแจ้งเตือนในขณะนี้</p>';
        } else {
            alertsContainer.classList.remove('empty');
            alertsContainer.innerHTML = '<h4>สินค้าใกล้หมด</h4><ul id="low-stock-alerts"></ul>';

            // สร้างรายการแจ้งเตือนใหม่
            const lowStockAlertsList = document.getElementById('low-stock-alerts');
            lowStockProducts.forEach(product => {
                const li = document.createElement('li');
                li.textContent = `${product.name} (เหลือ ${product.quantity} ชิ้น, ขั้นต่ำ ${product.minimumStock} ชิ้น)`;
                lowStockAlertsList.appendChild(li);
            });
        }
    }
}

// อัปเดตส่วนแสดงข้อมูลการรับสินค้าล่าสุด
function updateRecentInboundSection(inboundLogs) {
    const container = document.getElementById('recent-inbound-container');
    if (!container) return;

    if (inboundLogs.length === 0) {
        container.innerHTML = '<p>ไม่มีประวัติการรับสินค้าล่าสุด</p>';
        return;
    }

    // สร้างตารางแสดงข้อมูลการรับสินค้าล่าสุด
    let html = `
        <table class="recent-inbound-table">
            <thead>
                <tr>
                    <th>วันที่</th>
                    <th>สินค้า</th>
                    <th>จำนวน</th>
                    <th>ผู้จัดส่ง</th>
                </tr>
            </thead>
            <tbody>
    `;

    // แสดงเฉพาะ 5 รายการล่าสุด
    const recentInbounds = inboundLogs.slice(0, 5);
    recentInbounds.forEach(inbound => {
        // แปลงวันที่ให้อยู่ในรูปแบบที่อ่านง่าย
        const date = formatDate(inbound.receivedDate);

        // เพิ่มแถวข้อมูล
        html += `
            <tr>
                <td>${date}</td>
                <td>${inbound.product.name}</td>
                <td>${inbound.quantityReceived}</td>
                <td>${inbound.supplierName || '-'}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <div class="view-all-link">
            <a href="/inbound.html">ดูทั้งหมด</a>
        </div>
    `;

    container.innerHTML = html;
}

// อัปเดตส่วนแสดงข้อมูลการส่งออกสินค้าล่าสุด
function updateRecentOutboundSection(outboundLogs) {
    const container = document.getElementById('recent-outbound-container');
    if (!container) return;

    if (outboundLogs.length === 0) {
        container.innerHTML = '<p>ไม่มีประวัติการส่งออกสินค้าล่าสุด</p>';
        return;
    }

    // สร้างตารางแสดงข้อมูลการส่งออกสินค้าล่าสุด
    let html = `
        <table class="recent-outbound-table">
            <thead>
                <tr>
                    <th>วันที่</th>
                    <th>สินค้า</th>
                    <th>จำนวน</th>
                    <th>ลูกค้า</th>
                </tr>
            </thead>
            <tbody>
    `;

    // แสดงเฉพาะ 5 รายการล่าสุด
    const recentOutbounds = outboundLogs.slice(0, 5);
    recentOutbounds.forEach(outbound => {
        // แปลงวันที่ให้อยู่ในรูปแบบที่อ่านง่าย
        const date = formatDate(outbound.outboundDate);

        // เพิ่มแถวข้อมูล
        html += `
            <tr>
                <td>${date}</td>
                <td>${outbound.product.name}</td>
                <td>${outbound.quantityExported}</td>
                <td>${outbound.customerName || '-'}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <div class="view-all-link">
            <a href="/outbound.html">ดูทั้งหมด</a>
        </div>
    `;

    container.innerHTML = html;
}