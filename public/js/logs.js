/* ============================================================
   AI SRE Dashboard — Log Explorer Page
   ============================================================ */

const LogsPage = (() => {
  let logs = [];
  let levelFilters = { error: true, warn: true, info: true, debug: true };
  let serviceFilter = 'all';
  let searchQuery = '';
  let autoTail = true;

  function render() {
    return `
      <div class="flex-between mb-md">
        <div>
          <h1 class="page-title">Log Explorer</h1>
          <p class="page-subtitle">Search, filter, and analyze application logs</p>
        </div>
        <div class="flex-center gap-sm">
          <button class="btn btn-sm ${autoTail?'btn-primary':'btn-secondary'}" onclick="LogsPage.toggleAutoTail()" id="autotail-btn">
            <span class="mi" style="font-size:14px">vertical_align_bottom</span>
            Auto-tail ${autoTail?'ON':'OFF'}
          </button>
          <button class="btn btn-sm btn-secondary" onclick="LogsPage.clearLogs()">
            <span class="mi" style="font-size:14px">delete_sweep</span> Clear
          </button>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="card mb-md" style="padding:var(--space-md)">
        <div class="flex-center gap-md" style="flex-wrap:wrap">
          <div style="flex:1;min-width:240px;position:relative">
            <span class="mi" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);font-size:16px">search</span>
            <input type="text" id="log-search" placeholder="Search logs (supports regex)..."
              style="width:100%;background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-sm);padding:8px 12px 8px 34px;color:var(--text-primary);font-size:13px;font-family:'JetBrains Mono',monospace;outline:none"
              oninput="LogsPage.setSearch(this.value)">
          </div>
          <div class="flex-center gap-sm">
            <button class="filter-chip ${levelFilters.error?'active':''}" onclick="LogsPage.toggleLevel('error')" style="${levelFilters.error?'border-color:var(--accent-red);color:var(--accent-red)':''}">
              <span class="chip-dot" style="background:var(--accent-red)"></span> ERROR
            </button>
            <button class="filter-chip ${levelFilters.warn?'active':''}" onclick="LogsPage.toggleLevel('warn')" style="${levelFilters.warn?'border-color:var(--accent-yellow);color:var(--accent-yellow)':''}">
              <span class="chip-dot" style="background:var(--accent-yellow)"></span> WARN
            </button>
            <button class="filter-chip ${levelFilters.info?'active':''}" onclick="LogsPage.toggleLevel('info')" style="${levelFilters.info?'border-color:var(--accent-blue);color:var(--accent-blue)':''}">
              <span class="chip-dot" style="background:var(--accent-blue)"></span> INFO
            </button>
            <button class="filter-chip ${levelFilters.debug?'active':''}" onclick="LogsPage.toggleLevel('debug')">
              <span class="chip-dot" style="background:var(--text-tertiary)"></span> DEBUG
            </button>
          </div>
          <select id="log-service-filter"
            style="background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-sm);padding:6px 12px;color:var(--text-primary);font-size:12px;outline:none"
            onchange="LogsPage.setServiceFilter(this.value)">
            <option value="all">All Services</option>
            ${MockData.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Log Stream + AI Panel -->
      <div class="grid-2-1">
        <!-- Log Stream -->
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:8px var(--space-md);border-bottom:1px solid var(--border-primary);display:flex;align-items:center;justify-content:space-between">
            <span class="text-sm text-secondary" id="log-count">0 entries</span>
            <div class="flex-center gap-sm">
              <span class="live-dot" style="width:6px;height:6px"></span>
              <span class="text-sm text-green">Streaming</span>
            </div>
          </div>
          <div id="log-container" style="height:520px;overflow-y:auto;font-size:0">
            <!-- Log entries rendered here -->
          </div>
        </div>

        <!-- AI Pattern Analysis -->
        <div>
          <div class="insight-card mb-md">
            <h4 style="font-size:13px;font-weight:600;margin-bottom:var(--space-md)">
              <span class="mi" style="font-size:16px;vertical-align:middle;margin-right:4px;color:var(--accent-purple)">auto_awesome</span>
              AI Pattern Analysis
            </h4>
            <div class="mb-md">
              <div class="flex-between mb-sm">
                <span class="text-sm" style="font-weight:500">Error spike in payment-service</span>
                <span class="badge badge-down">High</span>
              </div>
              <p class="text-sm text-secondary" style="line-height:1.5">
                Detected 340% increase in ERROR logs from payment-service correlating with DB connection timeout messages. Pattern matches INC-2024-0847.
              </p>
            </div>
            <div class="mb-md">
              <div class="flex-between mb-sm">
                <span class="text-sm" style="font-weight:500">Repeated retry patterns</span>
                <span class="badge badge-degraded">Medium</span>
              </div>
              <p class="text-sm text-secondary" style="line-height:1.5">
                auth-service showing repeated retry attempts (3x rate) for cache lookups. May indicate cache-redis connectivity issues.
              </p>
            </div>
            <div>
              <div class="flex-between mb-sm">
                <span class="text-sm" style="font-weight:500">Slow query clustering</span>
                <span class="badge badge-info">Info</span>
              </div>
              <p class="text-sm text-secondary" style="line-height:1.5">
                85% of slow query warnings originate from 3 specific endpoints in order-service. Consider query optimization.
              </p>
            </div>
          </div>

          <div class="card">
            <h4 style="font-size:13px;font-weight:600;margin-bottom:var(--space-md)">Log Level Distribution</h4>
            <div id="log-level-chart" style="height:180px"></div>
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    logs = MockData.generateLogBatch(100);
    renderLogs();
    startStreaming();
    createLogChart();
  }

  function renderLogs() {
    const container = document.getElementById('log-container');
    if (!container) return;

    const filtered = logs.filter(l => {
      if (!levelFilters[l.level]) return false;
      if (serviceFilter !== 'all' && l.service !== serviceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return l.message.toLowerCase().includes(q) || l.service.toLowerCase().includes(q);
      }
      return true;
    });

    const countEl = document.getElementById('log-count');
    if (countEl) countEl.textContent = filtered.length + ' entries';

    container.innerHTML = filtered.map(l => {
      let msg = l.message;
      if (searchQuery) {
        const re = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        msg = msg.replace(re, '<span class="highlight">$1</span>');
      }
      return `<div class="log-entry">
        <span class="log-time">${App.formatTime(l.timestamp)}</span>
        <span class="log-level ${l.level}">${l.level.toUpperCase()}</span>
        <span class="log-service">[${l.service}]</span>
        <span class="log-message">${msg} <span style="color:var(--text-tertiary);font-size:10px">trace:${l.traceId}</span></span>
      </div>`;
    }).join('');

    if (autoTail) {
      container.scrollTop = container.scrollHeight;
    }
  }

  let logChart = null;

  function createLogChart() {
    const el = document.getElementById('log-level-chart');
    if (!el) return;

    const counts = { error: 0, warn: 0, info: 0, debug: 0 };
    logs.forEach(l => counts[l.level]++);

    logChart = new ApexCharts(el, {
      chart: { type: 'donut', height: 180, background: 'transparent' },
      series: [counts.error, counts.warn, counts.info, counts.debug],
      labels: ['ERROR', 'WARN', 'INFO', 'DEBUG'],
      colors: ['#ef4444', '#f59e0b', '#3b82f6', '#64748b'],
      plotOptions: { pie: { donut: { size: '65%' } } },
      dataLabels: { enabled: false },
      legend: { position: 'bottom', labels: { colors: '#94a3b8' }, fontSize: '11px' },
      stroke: { show: false },
      tooltip: { theme: 'dark' },
    });
    logChart.render();
  }

  function startStreaming() {
    App.registerInterval(() => {
      const newLog = MockData.generateLogEntry();
      logs.push(newLog);
      if (logs.length > 500) logs.shift();
      renderLogs();
    }, 800);
  }

  function toggleLevel(level) {
    levelFilters[level] = !levelFilters[level];
    // Re-render just filters and logs
    const container = document.getElementById('page-content');
    if (container) {
      container.innerHTML = render();
      logs = logs; // Keep existing logs
      renderLogs();
      createLogChart();
      startStreaming();
    }
  }

  function setSearch(q) {
    searchQuery = q;
    renderLogs();
  }

  function setServiceFilter(svc) {
    serviceFilter = svc;
    renderLogs();
  }

  function toggleAutoTail() {
    autoTail = !autoTail;
    const btn = document.getElementById('autotail-btn');
    if (btn) {
      btn.className = `btn btn-sm ${autoTail ? 'btn-primary' : 'btn-secondary'}`;
      btn.innerHTML = `<span class="mi" style="font-size:14px">vertical_align_bottom</span> Auto-tail ${autoTail?'ON':'OFF'}`;
    }
  }

  function clearLogs() {
    logs = [];
    renderLogs();
  }

  function destroy() {
    if (logChart) { try { logChart.destroy(); } catch(e) {} logChart = null; }
  }

  return { render, init, destroy, toggleLevel, setSearch, setServiceFilter, toggleAutoTail, clearLogs };
})();
