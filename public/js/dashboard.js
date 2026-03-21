/* ============================================================
   AI SRE Dashboard — Dashboard Overview Page
   ============================================================ */

const DashboardPage = (() => {
  let sparklineCharts = [];

  function render() {
    const services = MockData.services;
    const activeIncidents = MockData.incidents.filter(i => i.status !== 'resolved');

    return `
      <div class="flex-between mb-md">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">System overview and health status</p>
        </div>
        <div class="flex-center gap-sm">
          <span class="text-sm text-secondary">Last updated: ${new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <!-- Anomaly Banner -->
      <div class="anomaly-banner">
        <span class="anomaly-icon mi">auto_awesome</span>
        <div class="anomaly-text">
          <strong>AI Alert:</strong> Unusual traffic pattern detected on API Gateway — 340% increase in request volume (92% confidence).
          <a href="#ai-insights" style="margin-left:8px">View Details →</a>
        </div>
        <button class="btn btn-sm btn-ghost" style="color:var(--text-secondary);flex-shrink:0">Dismiss</button>
      </div>

      <!-- KPI Cards + Health Gauge -->
      <div style="display:grid;grid-template-columns:200px 1fr;gap:var(--space-md);margin-bottom:var(--space-lg)">
        <!-- Health Score -->
        <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="health-gauge">
            <svg viewBox="0 0 160 160">
              <circle class="health-gauge-bg" cx="80" cy="80" r="70"/>
              <circle class="health-gauge-fill" cx="80" cy="80" r="70"
                stroke="var(--accent-green)"
                stroke-dasharray="439.82"
                stroke-dashoffset="${439.82 * (1 - 0.94)}"
                id="health-arc"/>
            </svg>
            <div class="health-gauge-value">
              <div class="health-gauge-number text-green" id="health-score">94</div>
              <div class="health-gauge-label">Health Score</div>
            </div>
          </div>
          <div class="badge badge-healthy mt-sm">All Systems Operational</div>
        </div>

        <!-- KPI Cards Grid -->
        <div class="grid-4">
          <div class="kpi-card green">
            <div class="kpi-label">Uptime</div>
            <div class="kpi-value text-green" id="kpi-uptime">99.97%</div>
            <div class="kpi-change up">↑ 0.02% from last week</div>
            <div class="kpi-sparkline" id="spark-uptime"></div>
          </div>
          <div class="kpi-card red">
            <div class="kpi-label">Error Rate</div>
            <div class="kpi-value" id="kpi-errors">0.12%</div>
            <div class="kpi-change down">↑ 0.05% from baseline</div>
            <div class="kpi-sparkline" id="spark-errors"></div>
          </div>
          <div class="kpi-card blue">
            <div class="kpi-label">P99 Latency</div>
            <div class="kpi-value" id="kpi-latency">245ms</div>
            <div class="kpi-change down">↑ 18ms from baseline</div>
            <div class="kpi-sparkline" id="spark-latency"></div>
          </div>
          <div class="kpi-card purple">
            <div class="kpi-label">Throughput</div>
            <div class="kpi-value" id="kpi-throughput">12.4K</div>
            <div class="kpi-change up">↑ 8% from yesterday</div>
            <div class="kpi-sparkline" id="spark-throughput"></div>
          </div>
        </div>
      </div>

      <!-- Services Grid + Incidents -->
      <div class="grid-2-1">
        <!-- Service Status Grid -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Service Status</div>
            <div class="flex-center gap-sm">
              <span class="badge badge-healthy">${services.filter(s=>s.status==='healthy').length} Healthy</span>
              <span class="badge badge-degraded">${services.filter(s=>s.status==='degraded').length} Degraded</span>
              <span class="badge badge-down">${services.filter(s=>s.status==='down').length} Down</span>
            </div>
          </div>
          <div class="grid-3" style="gap:var(--space-sm)">
            ${services.map(s => `
              <div class="service-card">
                <div class="service-dot ${s.status}"></div>
                <div class="service-name truncate">${s.name}</div>
                <div class="service-latency">${s.latency}ms</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Recent Incidents -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Active Incidents</div>
            <a href="#incidents" class="btn btn-sm btn-ghost">View All →</a>
          </div>
          <div class="timeline">
            ${activeIncidents.map(inc => `
              <div class="timeline-item" style="cursor:pointer" onclick="IncidentsPage.showDetail('${inc.id}')">
                <div class="timeline-dot ${inc.severity === 'P1' ? 'red' : inc.severity === 'P2' ? 'yellow' : 'blue'}"></div>
                <div class="timeline-time">${App.timeAgo(inc.started)}</div>
                <div class="timeline-text">
                  <span class="badge severity-${inc.severity.toLowerCase()}" style="margin-right:4px">${inc.severity}</span>
                  ${inc.title}
                </div>
                <div class="text-sm text-secondary mt-sm">${inc.service} · ${inc.status}</div>
              </div>
            `).join('')}
            ${MockData.incidents.filter(i => i.status === 'resolved').slice(0, 2).map(inc => `
              <div class="timeline-item">
                <div class="timeline-dot green"></div>
                <div class="timeline-time">${App.timeAgo(inc.started)}</div>
                <div class="timeline-text" style="opacity:.6">
                  <span class="badge severity-${inc.severity.toLowerCase()}" style="margin-right:4px">${inc.severity}</span>
                  ${inc.title}
                </div>
                <div class="text-sm text-secondary mt-sm">${inc.service} · resolved</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    // Create sparklines
    const sparkOpts = (color, data) => ({
      chart: { type: 'area', height: 40, sparkline: { enabled: true }, animations: { enabled: false } },
      series: [{ data: data.map(d => d.y) }],
      stroke: { curve: 'smooth', width: 1.5 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0 } },
      colors: [color],
      tooltip: { enabled: false },
    });

    const uptimeData = MockData.generateTimeSeries(20, 99.95, 0.03);
    const errorData = MockData.generateTimeSeries(20, 0.12, 0.08);
    const latencyData = MockData.generateTimeSeries(20, 245, 40);
    const throughputData = MockData.generateTimeSeries(20, 12400, 2000);

    sparklineCharts = [
      new ApexCharts(document.getElementById('spark-uptime'), sparkOpts('#10b981', uptimeData)),
      new ApexCharts(document.getElementById('spark-errors'), sparkOpts('#ef4444', errorData)),
      new ApexCharts(document.getElementById('spark-latency'), sparkOpts('#3b82f6', latencyData)),
      new ApexCharts(document.getElementById('spark-throughput'), sparkOpts('#8b5cf6', throughputData)),
    ];
    sparklineCharts.forEach(c => c.render());
  }

  function destroy() {
    sparklineCharts.forEach(c => { try { c.destroy(); } catch(e) {} });
    sparklineCharts = [];
  }

  return { render, init, destroy };
})();
