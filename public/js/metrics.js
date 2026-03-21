/* ============================================================
   AI SRE Dashboard — Metrics & Monitoring Page
   ============================================================ */

const MetricsPage = (() => {
  let charts = [];
  let timeRange = '1h';

  function render() {
    return `
      <div class="flex-between mb-md">
        <div>
          <h1 class="page-title">Metrics & Monitoring</h1>
          <p class="page-subtitle">Real-time infrastructure and application metrics</p>
        </div>
        <div class="flex-center gap-md">
          <select id="metrics-service-filter" style="background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-sm);padding:6px 12px;color:var(--text-primary);font-size:12px;outline:none;">
            <option value="all">All Services</option>
            ${MockData.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
          <div class="toggle-group">
            <button class="toggle-btn active" data-range="1h" onclick="MetricsPage.setRange('1h')">1H</button>
            <button class="toggle-btn" data-range="6h" onclick="MetricsPage.setRange('6h')">6H</button>
            <button class="toggle-btn" data-range="24h" onclick="MetricsPage.setRange('24h')">24H</button>
            <button class="toggle-btn" data-range="7d" onclick="MetricsPage.setRange('7d')">7D</button>
          </div>
        </div>
      </div>

      <!-- SLO Burn Rate Gauges -->
      <div class="grid-3 mb-lg">
        <div class="card" style="text-align:center">
          <div class="card-title mb-md">Availability SLO</div>
          <div id="slo-availability" style="display:flex;justify-content:center"></div>
          <div class="text-sm mt-sm">Target: 99.95% · Current: <span class="text-green">99.97%</span></div>
          <div class="text-sm text-secondary">Error budget remaining: 87%</div>
        </div>
        <div class="card" style="text-align:center">
          <div class="card-title mb-md">Latency SLO</div>
          <div id="slo-latency" style="display:flex;justify-content:center"></div>
          <div class="text-sm mt-sm">Target: P99 < 500ms · Current: <span class="text-green">245ms</span></div>
          <div class="text-sm text-secondary">Error budget remaining: 72%</div>
        </div>
        <div class="card" style="text-align:center">
          <div class="card-title mb-md">Error Budget Burn Rate</div>
          <div id="slo-errorbudget" style="display:flex;justify-content:center"></div>
          <div class="text-sm mt-sm">Burn rate: <span class="text-yellow">1.4x</span></div>
          <div class="text-sm text-secondary">At this rate, budget exhausts in 18d</div>
        </div>
      </div>

      <!-- Time Series Charts -->
      <div class="grid-2 mb-lg">
        <div class="card">
          <div class="card-header">
            <div class="card-title">CPU Utilization (%)</div>
            <div class="live-indicator"><span class="live-dot"></span>Live</div>
          </div>
          <div id="chart-cpu" style="height:240px"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">Memory Usage (%)</div>
            <div class="live-indicator"><span class="live-dot"></span>Live</div>
          </div>
          <div id="chart-memory" style="height:240px"></div>
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Network I/O (MB/s)</div>
            <div class="live-indicator"><span class="live-dot"></span>Live</div>
          </div>
          <div id="chart-network" style="height:240px"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">Request Rate (req/s)</div>
            <div class="live-indicator"><span class="live-dot"></span>Live</div>
          </div>
          <div id="chart-requests" style="height:240px"></div>
        </div>
      </div>
    `;
  }

  function init() {
    createSLOGauges();
    createTimeSeriesCharts();
    startLiveUpdates();
  }

  function createSLOGauges() {
    const gaugeOpts = (value, color, el) => ({
      chart: { type: 'radialBar', height: 160, background: 'transparent' },
      series: [value],
      plotOptions: {
        radialBar: {
          hollow: { size: '60%' },
          track: { background: '#1e293b', strokeWidth: '100%' },
          dataLabels: {
            name: { show: false },
            value: { fontSize: '22px', fontWeight: 700, color: '#e2e8f0', offsetY: 8, formatter: v => v + '%' }
          }
        }
      },
      fill: { colors: [color] },
      stroke: { lineCap: 'round' },
    });

    const c1 = new ApexCharts(document.getElementById('slo-availability'), gaugeOpts(87, '#10b981'));
    const c2 = new ApexCharts(document.getElementById('slo-latency'), gaugeOpts(72, '#3b82f6'));
    const c3 = new ApexCharts(document.getElementById('slo-errorbudget'), gaugeOpts(58, '#f59e0b'));
    c1.render(); c2.render(); c3.render();
    charts.push(c1, c2, c3);
  }

  function getPoints() {
    const rangeMap = { '1h': 60, '6h': 360, '24h': 1440, '7d': 10080 };
    return Math.min(rangeMap[timeRange] || 60, 120);
  }

  function createTimeSeriesCharts() {
    const defaults = App.chartDefaults();
    const pts = getPoints();

    // CPU chart
    const cpuChart = new ApexCharts(document.getElementById('chart-cpu'), {
      ...defaults,
      chart: { ...defaults.chart, type: 'area', height: 240 },
      series: [
        { name: 'api-gateway', data: MockData.generateTimeSeries(pts, 45, 15, 5) },
        { name: 'payment-service', data: MockData.generateTimeSeries(pts, 62, 20, 8) },
        { name: 'db-primary', data: MockData.generateTimeSeries(pts, 38, 10, 2) },
      ],
      fill: { type: 'gradient', gradient: { opacityFrom: 0.2, opacityTo: 0 } },
      yaxis: { ...defaults.yaxis, max: 100, labels: { ...defaults.yaxis.labels, formatter: v => Math.round(v) + '%' } },
      legend: { labels: { colors: '#94a3b8' }, fontSize: '11px', position: 'top', horizontalAlign: 'right' },
    });
    cpuChart.render();
    charts.push(cpuChart);

    // Memory chart
    const memChart = new ApexCharts(document.getElementById('chart-memory'), {
      ...defaults,
      chart: { ...defaults.chart, type: 'area', height: 240 },
      series: [
        { name: 'api-gateway', data: MockData.generateTimeSeries(pts, 58, 8, 3) },
        { name: 'user-service', data: MockData.generateTimeSeries(pts, 72, 10, 12) },
        { name: 'cache-redis', data: MockData.generateTimeSeries(pts, 42, 5, 1) },
      ],
      fill: { type: 'gradient', gradient: { opacityFrom: 0.2, opacityTo: 0 } },
      colors: ['#10b981', '#f59e0b', '#8b5cf6'],
      yaxis: { ...defaults.yaxis, max: 100, labels: { ...defaults.yaxis.labels, formatter: v => Math.round(v) + '%' } },
      legend: { labels: { colors: '#94a3b8' }, fontSize: '11px', position: 'top', horizontalAlign: 'right' },
    });
    memChart.render();
    charts.push(memChart);

    // Network chart
    const netChart = new ApexCharts(document.getElementById('chart-network'), {
      ...defaults,
      chart: { ...defaults.chart, type: 'line', height: 240 },
      series: [
        { name: 'Inbound', data: MockData.generateTimeSeries(pts, 85, 30) },
        { name: 'Outbound', data: MockData.generateTimeSeries(pts, 52, 20) },
      ],
      colors: ['#06b6d4', '#f97316'],
      yaxis: { ...defaults.yaxis, labels: { ...defaults.yaxis.labels, formatter: v => Math.round(v) + ' MB/s' } },
      legend: { labels: { colors: '#94a3b8' }, fontSize: '11px', position: 'top', horizontalAlign: 'right' },
    });
    netChart.render();
    charts.push(netChart);

    // Requests chart
    const reqChart = new ApexCharts(document.getElementById('chart-requests'), {
      ...defaults,
      chart: { ...defaults.chart, type: 'area', height: 240 },
      series: [
        { name: 'Requests/s', data: MockData.generateTimeSeries(pts, 12400, 3000, 1000, 0.03) },
      ],
      fill: { type: 'gradient', gradient: { opacityFrom: 0.25, opacityTo: 0 } },
      colors: ['#8b5cf6'],
      yaxis: { ...defaults.yaxis, labels: { ...defaults.yaxis.labels, formatter: v => (v/1000).toFixed(1) + 'K' } },
      legend: { show: false },
    });
    reqChart.render();
    charts.push(reqChart);
  }

  function startLiveUpdates() {
    App.registerInterval(() => {
      // Append new data point to each chart (only the time-series ones, index 3-6)
      for (let i = 3; i < charts.length; i++) {
        const chart = charts[i];
        try {
          const seriesCount = chart.w.config.series.length;
          for (let s = 0; s < seriesCount; s++) {
            const lastY = chart.w.config.series[s].data.slice(-1)[0]?.y || 50;
            const newVal = Math.max(0, lastY + (Math.random() - 0.48) * 10);
            chart.appendData([{ data: [{ x: Date.now(), y: Math.round(newVal * 100) / 100 }] }]);
          }
        } catch (e) {}
      }
    }, 3000);
  }

  function setRange(range) {
    timeRange = range;
    document.querySelectorAll('.toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.range === range);
    });
    destroy();
    charts = [];
    createSLOGauges();
    createTimeSeriesCharts();
    startLiveUpdates();
  }

  function destroy() {
    charts.forEach(c => { try { c.destroy(); } catch(e) {} });
    charts = [];
  }

  return { render, init, destroy, setRange };
})();
