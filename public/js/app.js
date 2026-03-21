/* ============================================================
   AI SRE Dashboard — App Router & Initialization
   ============================================================ */

const App = (() => {
  let currentPage = null;
  let updateIntervals = [];

  const pages = {
    dashboard: DashboardPage,
    metrics: MetricsPage,
    incidents: IncidentsPage,
    logs: LogsPage,
    alerts: AlertsPage,
    'ai-insights': AIInsightsPage,
    'service-map': ServiceMapPage,
  };

  function init() {
    window.addEventListener('hashchange', navigate);
    document.addEventListener('click', (e) => {
      const dd = document.getElementById('notif-dropdown');
      if (dd && dd.classList.contains('show') && !e.target.closest('#notif-btn') && !e.target.closest('#notif-dropdown')) {
        dd.classList.remove('show');
      }
    });
    navigate();
  }

  function navigate() {
    const hash = (location.hash || '#dashboard').substring(1);
    const pageName = hash.split('/')[0];

    if (currentPage === pageName) return;

    // Stop previous page updates
    stopUpdates();
    if (pages[currentPage] && pages[currentPage].destroy) {
      pages[currentPage].destroy();
    }

    currentPage = pageName;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageName);
    });

    // Render page
    const container = document.getElementById('page-content');
    container.scrollTop = 0;

    if (pages[pageName]) {
      container.innerHTML = pages[pageName].render();
      container.classList.add('page-enter');
      setTimeout(() => container.classList.remove('page-enter'), 300);

      if (pages[pageName].init) {
        pages[pageName].init();
      }
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><span class="mi" style="font-size:48px">explore_off</span></div>
          <div class="empty-state-text">Page not found</div>
        </div>`;
    }
  }

  function registerInterval(fn, ms) {
    const id = setInterval(fn, ms);
    updateIntervals.push(id);
    return id;
  }

  function stopUpdates() {
    updateIntervals.forEach(id => clearInterval(id));
    updateIntervals = [];
  }

  function refresh() {
    const page = pages[currentPage];
    if (page && page.destroy) page.destroy();
    stopUpdates();
    const container = document.getElementById('page-content');
    if (page) {
      container.innerHTML = page.render();
      if (page.init) page.init();
    }
  }

  function toggleNotifications() {
    document.getElementById('notif-dropdown').classList.toggle('show');
  }

  function closeModal() {
    document.getElementById('incident-modal').classList.remove('open');
  }

  function openModal(title, subtitle, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-subtitle').textContent = subtitle;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('incident-modal').classList.add('open');
  }

  // Utility: format relative time
  function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return Math.floor(diff / 86400000) + 'd ago';
  }

  function formatTime(d) {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  function formatDuration(ms) {
    if (ms < 60000) return Math.floor(ms / 1000) + 's';
    if (ms < 3600000) return Math.floor(ms / 60000) + 'm';
    return Math.floor(ms / 3600000) + 'h ' + Math.floor((ms % 3600000) / 60000) + 'm';
  }

  // Chart defaults
  function chartDefaults() {
    return {
      chart: {
        background: 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', dynamicAnimation: { speed: 800 } },
      },
      theme: { mode: 'dark' },
      grid: {
        borderColor: '#1e293b',
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        type: 'datetime',
        labels: { style: { colors: '#64748b', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { colors: '#64748b', fontSize: '11px' } },
      },
      tooltip: {
        theme: 'dark',
        x: { format: 'HH:mm:ss' },
      },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    };
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', init);

  return {
    registerInterval,
    stopUpdates,
    refresh,
    toggleNotifications,
    closeModal,
    openModal,
    timeAgo,
    formatTime,
    formatDuration,
    chartDefaults,
    navigate,
  };
})();
