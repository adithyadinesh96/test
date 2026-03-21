/* ============================================================
   AI SRE Dashboard — AI Insights Page
   ============================================================ */

const AIInsightsPage = (() => {
  let correlationChart = null;

  function render() {
    const anomalies = MockData.anomalies;
    const predictions = MockData.predictions;
    const recommendations = MockData.recommendations;

    return `
      <div class="flex-between mb-md">
        <div>
          <h1 class="page-title">AI Insights</h1>
          <p class="page-subtitle">AI-powered anomaly detection, predictions, and recommendations</p>
        </div>
        <div class="flex-center gap-sm">
          <span class="badge badge-purple">
            <span class="mi" style="font-size:14px">auto_awesome</span>
            Powered by AI
          </span>
        </div>
      </div>

      <!-- AI Query Interface -->
      <div class="card mb-lg">
        <div class="card-header">
          <div class="card-title">
            <span class="mi" style="font-size:16px;vertical-align:middle;margin-right:4px;color:var(--accent-purple)">chat</span>
            Ask AI about your infrastructure
          </div>
        </div>
        <div class="ai-query-box">
          <input type="text" class="ai-query-input" id="ai-query-input"
            placeholder="e.g., 'What caused the latency spike at 2pm?' or 'Show me error trends for payment-service'"
            onkeydown="if(event.key==='Enter')AIInsightsPage.submitQuery()">
          <button class="btn btn-primary" onclick="AIInsightsPage.submitQuery()">
            <span class="mi" style="font-size:16px">send</span> Ask
          </button>
        </div>
        <div id="ai-response-area"></div>
      </div>

      <!-- Anomaly Detection -->
      <div class="mb-lg">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:var(--space-md)">
          <span class="mi" style="font-size:18px;vertical-align:middle;margin-right:4px;color:var(--accent-red)">report</span>
          Anomaly Detection
        </h2>
        <div class="grid-2">
          ${anomalies.map(a => {
            const sevColor = a.severity === 'high' ? 'var(--accent-red)' : a.severity === 'medium' ? 'var(--accent-yellow)' : 'var(--accent-blue)';
            const sevBg = a.severity === 'high' ? 'var(--accent-red-dim)' : a.severity === 'medium' ? 'var(--accent-yellow-dim)' : 'var(--accent-blue-dim)';
            return `
            <div class="insight-card">
              <div class="flex-between mb-sm">
                <span class="insight-confidence">${a.confidence}% confidence</span>
                <div class="flex-center gap-sm">
                  <span class="badge" style="background:${sevBg};color:${sevColor}">${a.severity}</span>
                  <span class="text-sm text-secondary">${App.timeAgo(a.detected)}</span>
                </div>
              </div>
              <div class="insight-title">${a.title}</div>
              <div class="insight-desc">${a.description}</div>
              <div class="flex-center gap-sm mt-md">
                <span class="badge badge-info">${a.service}</span>
                <span class="text-sm text-secondary">Metric: ${a.metric}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Predictive Alerts + Change Correlation -->
      <div class="grid-2 mb-lg">
        <!-- Predictive Alerts -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="mi" style="font-size:16px;vertical-align:middle;margin-right:4px;color:var(--accent-cyan)">trending_up</span>
              Predictive Alerts
            </div>
          </div>
          ${predictions.map(p => {
            const impactColor = p.impact === 'high' ? 'var(--accent-red)' : p.impact === 'medium' ? 'var(--accent-yellow)' : 'var(--accent-blue)';
            return `
            <div style="display:flex;align-items:center;gap:var(--space-md);padding:12px 0;border-bottom:1px solid var(--border-primary)">
              <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:rgba(6,182,212,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="mi" style="font-size:18px;color:var(--accent-cyan)">schedule</span>
              </div>
              <div style="flex:1">
                <div class="text-sm" style="font-weight:500">${p.title}</div>
              </div>
              <div style="text-align:right">
                <span class="badge" style="background:rgba(${p.impact==='high'?'239,68,68':p.impact==='medium'?'245,158,11':'59,130,246'},.15);color:${impactColor}">ETA: ${p.eta}</span>
              </div>
            </div>`;
          }).join('')}
        </div>

        <!-- Change Correlation -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="mi" style="font-size:16px;vertical-align:middle;margin-right:4px;color:var(--accent-orange)">compare_arrows</span>
              Deploy ↔ Incident Correlation
            </div>
          </div>
          <div id="correlation-chart" style="height:240px"></div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span class="mi" style="font-size:16px;vertical-align:middle;margin-right:4px;color:var(--accent-green)">lightbulb</span>
            Reliability Recommendations
          </div>
          <span class="text-sm text-secondary">${recommendations.length} suggestions</span>
        </div>
        <div>
          ${recommendations.map((r, i) => `
            <div style="display:flex;align-items:flex-start;gap:var(--space-md);padding:16px 0;${i < recommendations.length - 1 ? 'border-bottom:1px solid var(--border-primary)' : ''}">
              <div style="min-width:48px;text-align:center">
                <div style="font-size:20px;font-weight:700;color:var(--accent-green)">${r.impact}</div>
                <div class="text-sm text-secondary">impact</div>
              </div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:600;margin-bottom:4px">${r.title}</div>
                <div class="text-sm text-secondary" style="line-height:1.6">${r.description}</div>
              </div>
              <button class="btn btn-sm btn-secondary" style="flex-shrink:0">Apply</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function init() {
    createCorrelationChart();
  }

  function createCorrelationChart() {
    const el = document.getElementById('correlation-chart');
    if (!el) return;

    const defaults = App.chartDefaults();
    const now = Date.now();
    const deployments = [
      { x: now - 90*60000, y: 0 },
      { x: now - 48*3600000, y: 0 },
      { x: now - 24*3600000, y: 0 },
      { x: now - 6*3600000, y: 0 },
    ];

    correlationChart = new ApexCharts(el, {
      ...defaults,
      chart: { ...defaults.chart, type: 'line', height: 240 },
      series: [
        { name: 'Error Rate %', type: 'area', data: MockData.generateTimeSeries(48, 0.1, 0.15, 0, 0.04) },
        { name: 'Deployments', type: 'scatter', data: deployments },
      ],
      colors: ['#ef4444', '#3b82f6'],
      fill: { type: ['gradient', 'solid'], gradient: { opacityFrom: 0.2, opacityTo: 0 } },
      markers: { size: [0, 8], strokeColors: '#111827', strokeWidth: 2 },
      yaxis: [
        { ...defaults.yaxis, title: { text: 'Error Rate %', style: { color: '#64748b', fontSize: '11px' } }, labels: { ...defaults.yaxis.labels, formatter: v => v.toFixed(2) + '%' } },
        { opposite: true, show: false },
      ],
      legend: { labels: { colors: '#94a3b8' }, fontSize: '11px' },
      annotations: {
        xaxis: [
          { x: now - 90*60000, borderColor: '#3b82f6', label: { text: 'v2.14.3', borderColor: '#3b82f6', style: { color: '#fff', background: '#3b82f6', fontSize: '10px' } } },
          { x: now - 6*3600000, borderColor: '#3b82f6', label: { text: 'v2.14.2 (rollback)', borderColor: '#10b981', style: { color: '#fff', background: '#10b981', fontSize: '10px' } } },
        ]
      }
    });
    correlationChart.render();
  }

  const aiResponses = {
    'latency': `Based on my analysis of the last 24 hours of metrics data:

**Root Cause:** The latency spike at ~14:00 UTC was caused by deployment <code>v2.14.3</code> which changed the upstream connection timeout from 30s to 3s on the API Gateway.

**Evidence:**
- Error rate jumped from 0.08% to 2.3% within 5 minutes of deployment
- Correlation coefficient between deploy event and error spike: **r = 0.94**
- Affected services: search-service (P99: 3.2s) and analytics-service (P99: 4.1s) exceeded new 3s timeout
- 87% of errors were HTTP 502 (Bad Gateway)

**Resolution:** Rollback to v2.14.2 was completed at 14:45 UTC. Error rate recovered to baseline within 10 minutes.`,

    'error': `Here's the error trend analysis for **payment-service** over the last 7 days:

**Current Status:** Error rate elevated at **1.2%** (baseline: 0.04%)
**Trend:** Increasing since 13:25 UTC today

**Top Error Types:**
1. \`ConnectionPoolExhausted\` — 68% of errors (new, started 35 min ago)
2. \`RequestTimeout\` — 24% of errors (correlated with #1)
3. \`CardDeclined\` — 8% (normal, business logic)

**Correlation:** This error pattern matches **INC-2024-0847** (currently investigating). The connection pool exhaustion is caused by analytics-service running heavy queries against the primary database.`,

    'default': `I've analyzed your infrastructure metrics and here's what I found:

**System Health:** Overall score 94/100 — 2 services degraded (payment-service, analytics-service)

**Key Observations:**
- Payment-service latency is 5x above baseline due to DB connection pool exhaustion
- Memory usage in user-service shows linear growth pattern (potential leak)
- API Gateway traffic is 340% above normal — recommend investigating for potential bot activity
- Disk usage on db-primary trending toward 90% threshold (ETA: ~6 hours)

**Recommended Actions:**
1. Resolve INC-2024-0847 (payment-service) — kill long-running analytics query
2. Monitor user-service memory (similar pattern to previous OOM incident)
3. Enable rate limiting on API Gateway as precaution`
  };

  function submitQuery() {
    const input = document.getElementById('ai-query-input');
    const area = document.getElementById('ai-response-area');
    if (!input || !area) return;

    const q = input.value.trim();
    if (!q) return;

    // Show loading
    area.innerHTML = `<div class="ai-response" style="opacity:.6">
      <div class="ai-tag"><span class="mi" style="font-size:14px">auto_awesome</span> AI Analyzing...</div>
      <div style="display:flex;gap:4px;margin-top:8px">
        <div style="width:6px;height:6px;border-radius:50%;background:var(--accent-purple);animation:pulse-dot 1s infinite"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:var(--accent-purple);animation:pulse-dot 1s .2s infinite"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:var(--accent-purple);animation:pulse-dot 1s .4s infinite"></div>
      </div>
    </div>`;

    // Simulate AI response delay
    setTimeout(() => {
      let response = aiResponses.default;
      const ql = q.toLowerCase();
      if (ql.includes('latency') || ql.includes('spike') || ql.includes('2pm') || ql.includes('14:')) {
        response = aiResponses.latency;
      } else if (ql.includes('error') || ql.includes('payment')) {
        response = aiResponses.error;
      }

      area.innerHTML = `<div class="ai-response">
        <div class="ai-tag"><span class="mi" style="font-size:14px">auto_awesome</span> AI Response</div>
        <div style="white-space:pre-line;line-height:1.7">${response}</div>
      </div>`;
    }, 1500);

    input.value = '';
  }

  function destroy() {
    if (correlationChart) { try { correlationChart.destroy(); } catch(e) {} correlationChart = null; }
  }

  return { render, init, destroy, submitQuery };
})();
