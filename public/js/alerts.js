/* ============================================================
   AI SRE Dashboard — Alerts & On-Call Page
   ============================================================ */

const AlertsPage = (() => {
  let alertChart = null;

  function render() {
    const rules = MockData.alertRules;
    const firing = rules.filter(r => r.status === 'firing').length;
    const schedule = MockData.oncallSchedule;

    return `
      <div class="flex-between mb-md">
        <div>
          <h1 class="page-title">Alerts & On-Call</h1>
          <p class="page-subtitle">Alert rules, history, and on-call management</p>
        </div>
        <button class="btn btn-primary">
          <span class="mi" style="font-size:16px">add</span> New Alert Rule
        </button>
      </div>

      <!-- Stats -->
      <div class="grid-4 mb-lg">
        <div class="kpi-card red">
          <div class="kpi-label">Firing</div>
          <div class="kpi-value text-red">${firing}</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-label">Active Rules</div>
          <div class="kpi-value text-green">${rules.filter(r=>r.status==='active').length}</div>
        </div>
        <div class="kpi-card yellow">
          <div class="kpi-label">Muted</div>
          <div class="kpi-value text-yellow">${rules.filter(r=>r.status==='muted').length}</div>
        </div>
        <div class="kpi-card blue">
          <div class="kpi-label">On-Call Now</div>
          <div class="kpi-value">${schedule.find(s=>s.current)?.name || 'N/A'}</div>
        </div>
      </div>

      <div class="grid-2-1">
        <!-- Left: Alert Rules + History -->
        <div>
          <!-- Alert Rules Table -->
          <div class="card mb-lg" style="padding:0;overflow:hidden">
            <div style="padding:12px var(--space-md);border-bottom:1px solid var(--border-primary)">
              <span class="card-title">Alert Rules</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Condition</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Last Fired</th>
                </tr>
              </thead>
              <tbody>
                ${rules.map(r => {
                  const sevColor = r.severity === 'critical' ? 'var(--accent-red)' : r.severity === 'warning' ? 'var(--accent-yellow)' : 'var(--accent-blue)';
                  const statusBadge = r.status === 'firing' ? 'badge-down' : r.status === 'muted' ? 'badge-degraded' : 'badge-healthy';
                  return `<tr>
                    <td><div class="alert-severity ${r.severity}" style="width:4px;height:24px;border-radius:2px;background:${sevColor}"></div></td>
                    <td style="font-weight:500">${r.name}</td>
                    <td><code class="text-sm" style="color:var(--text-tertiary)">${r.condition}</code></td>
                    <td class="text-secondary">${r.service}</td>
                    <td><span class="badge ${statusBadge}">${r.status}</span></td>
                    <td class="text-secondary">${r.lastFired ? App.timeAgo(r.lastFired) : 'Never'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Alert History Chart -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Alert Frequency (24h)</div>
            </div>
            <div id="alert-history-chart" style="height:200px"></div>
          </div>
        </div>

        <!-- Right: On-Call + Escalation -->
        <div>
          <!-- On-Call Schedule -->
          <div class="card mb-lg">
            <div class="card-header">
              <div class="card-title">On-Call Schedule</div>
              <span class="text-sm text-secondary">This Week</span>
            </div>
            ${schedule.map(s => `
              <div class="oncall-slot ${s.current ? 'style="background:var(--accent-blue-dim);border-radius:var(--radius-sm);margin:0 -var(--space-md)"' : ''}">
                <div class="oncall-avatar" style="background:${s.color}">${s.avatar}</div>
                <div class="oncall-name">${s.name} ${s.current ? '<span class="badge badge-info" style="margin-left:4px">Now</span>' : ''}</div>
                <div class="oncall-time">${s.shift}</div>
              </div>
            `).join('')}
          </div>

          <!-- Escalation Policy -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Escalation Policy</div>
            </div>
            <div class="escalation-flow" style="flex-direction:column;align-items:stretch">
              <div class="flex-center gap-md" style="padding:var(--space-sm) 0">
                <div class="escalation-circle" style="background:var(--accent-blue);width:36px;height:36px;font-size:13px">L1</div>
                <div style="flex:1">
                  <div class="text-sm" style="font-weight:600">On-Call Engineer</div>
                  <div class="text-sm text-secondary">Responds within 5 min</div>
                </div>
              </div>
              <div style="text-align:center;color:var(--text-tertiary);font-size:16px;padding:2px 0">
                <span class="mi">arrow_downward</span>
                <span class="text-sm text-secondary" style="margin-left:4px">15 min timeout</span>
              </div>
              <div class="flex-center gap-md" style="padding:var(--space-sm) 0">
                <div class="escalation-circle" style="background:var(--accent-yellow);width:36px;height:36px;font-size:13px">L2</div>
                <div style="flex:1">
                  <div class="text-sm" style="font-weight:600">Team Lead</div>
                  <div class="text-sm text-secondary">Sarah Chen · Responds within 10 min</div>
                </div>
              </div>
              <div style="text-align:center;color:var(--text-tertiary);font-size:16px;padding:2px 0">
                <span class="mi">arrow_downward</span>
                <span class="text-sm text-secondary" style="margin-left:4px">30 min timeout</span>
              </div>
              <div class="flex-center gap-md" style="padding:var(--space-sm) 0">
                <div class="escalation-circle" style="background:var(--accent-red);width:36px;height:36px;font-size:13px">L3</div>
                <div style="flex:1">
                  <div class="text-sm" style="font-weight:600">VP Engineering</div>
                  <div class="text-sm text-secondary">David Kim · P0/P1 only</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    createAlertChart();
  }

  function createAlertChart() {
    const el = document.getElementById('alert-history-chart');
    if (!el) return;

    const defaults = App.chartDefaults();
    alertChart = new ApexCharts(el, {
      ...defaults,
      chart: { ...defaults.chart, type: 'bar', height: 200 },
      series: [{ name: 'Alerts', data: MockData.generateAlertHistory(24) }],
      colors: ['#f59e0b'],
      plotOptions: {
        bar: { borderRadius: 3, columnWidth: '60%' },
      },
      yaxis: { ...defaults.yaxis, labels: { ...defaults.yaxis.labels, formatter: v => Math.round(v) } },
      dataLabels: { enabled: false },
    });
    alertChart.render();
  }

  function destroy() {
    if (alertChart) { try { alertChart.destroy(); } catch(e) {} alertChart = null; }
  }

  return { render, init, destroy };
})();
