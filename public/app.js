
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
  
  if (!grid) return;

  // 1. 保存当前滚动位置，防止每 15 秒重新渲染时页面跳回顶部
  const savedScrollTop = grid.scrollTop;

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

  // 2. 恢复先前的滚动高度
  grid.scrollTop = savedScrollTop;
}

document.getElementById('staffFilter').addEventListener('change', renderDashboard);

// 时钟与定时轮询数据 (Live Time)
setInterval(updateClock, 1000);
updateClock();

fetchDashboardData();
// TV 端每 15 秒自动更新一次最新数据
setInterval(fetchDashboardData, 15000);

// 定义自动滚动函数
function startAutoScroll(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const speed = 0.8; // 滚动速度，越小越平滑
  let isPaused = false;

  function step() {
    if (!isPaused && container) {
      container.scrollTop += speed;

      // 触底重置回顶部
      const reachedBottom = Math.ceil(container.scrollTop + container.clientHeight) >= container.scrollHeight;
      if (reachedBottom) {
        container.scrollTop = 0;
      }
    }
    requestAnimationFrame(step);
  }

  // 悬停/触摸暂停
  container.addEventListener('mouseenter', () => isPaused = true);
  container.addEventListener('mouseleave', () => isPaused = false);
  container.addEventListener('touchstart', () => isPaused = true, { passive: true });
  container.addEventListener('touchend', () => isPaused = false);

  step();
}

// 启动自动滚动（绑定你的 #ordersGrid 容器）
document.addEventListener('DOMContentLoaded', () => {
  startAutoScroll('#ordersGrid'); 
});