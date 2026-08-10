

let dashboardData = { staffs: [], orders: [] };

function updateClock() {
  const now = new Date();
  document.getElementById('clockTime').textContent = now.toLocaleTimeString();
  document.getElementById('clockDate').textContent = now.toLocaleDateString('zh-CN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

async function fetchDashboardData() {
  try {
    const res = await fetch('/api/dashboard');
    dashboardData = await res.json();
    populateStaffDropdown();
    renderDashboard();
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}

function populateStaffDropdown() {
  const select = document.getElementById('staffFilter');
  const currentSelection = select.value;
  
  // 保留默认选项
  select.innerHTML = '<option value="ALL">-- ALL STAFF --</option>';

  const staffNames = [...new Set(dashboardData.orders.map(o => o.staffName))];
  staffNames.forEach(name => {
    if (name) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    }
  });

  select.value = currentSelection || 'ALL';
}

function renderDashboard() {
  const selectedStaff = document.getElementById('staffFilter').value;
  const grid = document.getElementById('ordersGrid');
  grid.innerHTML = '';

  const filteredOrders = selectedStaff === 'ALL'
    ? dashboardData.orders
    : dashboardData.orders.filter(o => o.staffName === selectedStaff);

  // 更新 Statistics Cards
  const activeStaffSet = new Set(filteredOrders.map(o => o.staffName));
  document.getElementById('statStaffCount').textContent = activeStaffSet.size;
  document.getElementById('statTotalOrders').textContent = filteredOrders.length;
  document.getElementById('statCompleted').textContent = filteredOrders.filter(o => o.status === 'Completed').length;

  // 渲染订单卡片
  filteredOrders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';

    let arrivalsHtml = '';
    order.arrivals.forEach(arr => {
      let photosHtml = '';
      arr.photos.forEach(p => {
        photosHtml += `<span class="photo-badge" title="${p.url}">📷 ${p.label.replace('Photo ', '')}</span>`;
      });

      arrivalsHtml += `
        <div class="arrival-item">
          <div class="arrival-time">📍 ${arr.stage} - ${arr.time || 'N/A'}</div>
          <div class="arrival-address">🏠 ${arr.gpsAddress || 'No Address Data'} (${arr.gpsLocation || 'N/A'})</div>
          ${photosHtml ? `<div class="photo-gallery">${photosHtml}</div>` : ''}
        </div>
      `;
    });

    const isCompleted = order.status === 'Completed';

    card.innerHTML = `
      <div class="order-header">
        <div>
          <div class="staff-tag">👤 ${order.staffName}</div>
          <small style="color: #8b949e;">ID: ${order.inspectionId}</small>
        </div>
        <div>
          <span class="plate-tag">🚛 ${order.lorryPlate || 'N/A'}</span>
          <span class="status-tag ${isCompleted ? 'completed' : 'pending'}">${order.status}</span>
        </div>
      </div>

      <div class="info-row">
        <span>Departure / Start:</span>
        <strong>${order.dateTimeBefore || 'N/A'}</strong>
      </div>
      <div class="info-row">
        <span>Completion:</span>
        <strong>${order.dateTimeAfter || 'N/A'}</strong>
      </div>

      <div class="arrivals-container">
        <div class="arrivals-title">Arrival & Unloading Logs (${order.arrivals.length})</div>
        ${arrivalsHtml || '<div style="color: #8b949e; font-size: 0.85rem;">No arrival logs recorded</div>'}
      </div>
    `;

    grid.appendChild(card);
  });
}

document.getElementById('staffFilter').addEventListener('change', renderDashboard);

// 初始化与定时轮询（ Live Time）
setInterval(updateClock, 1000);
updateClock();

fetchDashboardData();
// TV 端每 15 秒自动更新一次最新数据
setInterval(fetchDashboardData, 15000);