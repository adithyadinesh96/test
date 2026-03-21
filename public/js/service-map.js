/* ============================================================
   AI SRE Dashboard — Service Map / Topology Page
   ============================================================ */

const ServiceMapPage = (() => {
  let network = null;

  function render() {
    const services = MockData.services;
    const healthy = services.filter(s => s.status === 'healthy').length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    const down = services.filter(s => s.status === 'down').length;

    return `
      <div class="flex-between mb-md">
        <div>
          <h1 class="page-title">Service Map</h1>
          <p class="page-subtitle">Interactive service dependency topology</p>
        </div>
        <div class="flex-center gap-sm">
          <span class="badge badge-healthy">${healthy} Healthy</span>
          <span class="badge badge-degraded">${degraded} Degraded</span>
          <span class="badge badge-down">${down} Down</span>
          <button class="btn btn-sm btn-secondary" onclick="ServiceMapPage.fitAll()">
            <span class="mi" style="font-size:14px">fit_screen</span> Fit
          </button>
          <button class="btn btn-sm btn-secondary" onclick="ServiceMapPage.togglePhysics()" id="physics-btn">
            <span class="mi" style="font-size:14px">grain</span> Physics: ON
          </button>
        </div>
      </div>

      <div class="grid-2-1">
        <!-- Network Graph -->
        <div class="card" style="padding:0;overflow:hidden;position:relative">
          <div id="service-network" style="height:560px;background:var(--bg-card)"></div>
          <!-- Legend -->
          <div style="position:absolute;bottom:12px;left:12px;background:rgba(17,24,39,.85);backdrop-filter:blur(8px);border:1px solid var(--border-primary);border-radius:var(--radius-sm);padding:10px 14px;font-size:11px">
            <div style="font-weight:600;margin-bottom:6px">Legend</div>
            <div style="display:flex;gap:12px">
              <div class="flex-center gap-sm"><span style="width:10px;height:10px;border-radius:50%;background:#10b981"></span> Healthy</div>
              <div class="flex-center gap-sm"><span style="width:10px;height:10px;border-radius:50%;background:#f59e0b"></span> Degraded</div>
              <div class="flex-center gap-sm"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444"></span> Down</div>
            </div>
          </div>
        </div>

        <!-- Service Detail Panel -->
        <div id="service-detail-panel">
          <div class="card" style="text-align:center;padding:var(--space-2xl)">
            <div class="empty-state-icon"><span class="mi" style="font-size:40px;color:var(--text-tertiary)">touch_app</span></div>
            <div class="text-sm text-secondary">Click a service node to view details</div>
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    createNetwork();
  }

  function createNetwork() {
    const container = document.getElementById('service-network');
    if (!container) return;

    const statusColor = {
      healthy: '#10b981',
      degraded: '#f59e0b',
      down: '#ef4444',
    };
    const statusBorder = {
      healthy: '#0d9668',
      degraded: '#d97706',
      down: '#dc2626',
    };

    const nodes = new vis.DataSet(
      MockData.services.map(s => ({
        id: s.id,
        label: s.name,
        color: {
          background: statusColor[s.status],
          border: statusBorder[s.status],
          highlight: { background: statusColor[s.status], border: '#fff' },
          hover: { background: statusColor[s.status], border: '#e2e8f0' },
        },
        font: { color: '#e2e8f0', size: 12, face: 'Inter, sans-serif' },
        shape: 'dot',
        size: Math.max(15, Math.min(35, s.rpm / 500)),
        borderWidth: 2,
        shadow: { enabled: true, color: statusColor[s.status], size: 10, x: 0, y: 0 },
      }))
    );

    const edges = new vis.DataSet(
      MockData.serviceEdges.map((e, i) => ({
        id: i,
        from: e.from,
        to: e.to,
        color: { color: '#2d3748', highlight: '#3b82f6', hover: '#3b82f6' },
        width: 1.5,
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
        smooth: { type: 'cubicBezier', roundness: 0.5 },
      }))
    );

    const options = {
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -3000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09,
        },
        stabilization: { iterations: 150 },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
      layout: {
        improvedLayout: true,
      },
    };

    network = new vis.Network(container, { nodes, edges }, options);

    // Click handler
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        showServiceDetail(params.nodes[0]);
      }
    });
  }

  function showServiceDetail(serviceId) {
    const svc = MockData.services.find(s => s.id === serviceId);
    if (!svc) return;

    const panel = document.getElementById('service-detail-panel');
    const statusClass = svc.status === 'healthy' ? 'badge-healthy' : svc.status === 'degraded' ? 'badge-degraded' : 'badge-down';

    // Find connected services
    const upstream = MockData.serviceEdges.filter(e => e.to === serviceId).map(e => MockData.services.find(s => s.id === e.from)?.name || e.from);
    const downstream = MockData.serviceEdges.filter(e => e.from === serviceId).map(e => MockData.services.find(s => s.id === e.to)?.name || e.to);

    // Find related incidents
    const incidents = MockData.incidents.filter(i => i.service === serviceId && i.status !== 'resolved');

    panel.innerHTML = `
      <div class="card mb-md">
        <div class="flex-center gap-sm mb-md">
          <div class="service-dot ${svc.status}" style="width:12px;height:12px"></div>
          <h3 style="font-size:16px;font-weight:600">${svc.name}</h3>
          <span class="badge ${statusClass}">${svc.status}</span>
        </div>

        <div class="grid-2" style="gap:var(--space-sm);margin-bottom:var(--space-md)">
          <div style="background:var(--bg-input);border-radius:var(--radius-sm);padding:12px;text-align:center">
            <div class="text-sm text-secondary">Latency (P99)</div>
            <div style="font-size:20px;font-weight:700;color:${svc.latency > 200 ? 'var(--accent-yellow)' : 'var(--text-primary)'}">${svc.latency}ms</div>
          </div>
          <div style="background:var(--bg-input);border-radius:var(--radius-sm);padding:12px;text-align:center">
            <div class="text-sm text-secondary">Error Rate</div>
            <div style="font-size:20px;font-weight:700;color:${svc.errorRate > 0.5 ? 'var(--accent-red)' : 'var(--text-primary)'}">${svc.errorRate}%</div>
          </div>
          <div style="background:var(--bg-input);border-radius:var(--radius-sm);padding:12px;text-align:center">
            <div class="text-sm text-secondary">Throughput</div>
            <div style="font-size:20px;font-weight:700">${svc.rpm > 1000 ? (svc.rpm/1000).toFixed(1)+'K' : svc.rpm} rpm</div>
          </div>
          <div style="background:var(--bg-input);border-radius:var(--radius-sm);padding:12px;text-align:center">
            <div class="text-sm text-secondary">Status</div>
            <div style="font-size:20px;font-weight:700;color:${svc.status==='healthy'?'var(--accent-green)':svc.status==='degraded'?'var(--accent-yellow)':'var(--accent-red)'}">
              ${svc.status === 'healthy' ? 'OK' : svc.status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <!-- Dependencies -->
      <div class="card mb-md">
        <div class="card-title mb-sm" style="font-size:13px">Dependencies</div>
        ${upstream.length > 0 ? `
          <div class="text-sm text-secondary mb-sm">Upstream (calls this service):</div>
          <div class="flex-center gap-sm mb-md" style="flex-wrap:wrap">
            ${upstream.map(u => `<span class="badge badge-info">${u}</span>`).join('')}
          </div>
        ` : ''}
        ${downstream.length > 0 ? `
          <div class="text-sm text-secondary mb-sm">Downstream (called by this service):</div>
          <div class="flex-center gap-sm" style="flex-wrap:wrap">
            ${downstream.map(d => `<span class="badge badge-purple">${d}</span>`).join('')}
          </div>
        ` : ''}
        ${upstream.length === 0 && downstream.length === 0 ? '<div class="text-sm text-secondary">No dependencies</div>' : ''}
      </div>

      <!-- Active Incidents -->
      ${incidents.length > 0 ? `
      <div class="card">
        <div class="card-title mb-sm" style="font-size:13px">Active Incidents</div>
        ${incidents.map(inc => `
          <div style="padding:8px 0;border-bottom:1px solid var(--border-primary);cursor:pointer" onclick="IncidentsPage.showDetail('${inc.id}')">
            <div class="flex-center gap-sm">
              <span class="badge severity-${inc.severity.toLowerCase()}">${inc.severity}</span>
              <span class="text-sm" style="font-weight:500">${inc.title}</span>
            </div>
            <div class="text-sm text-secondary mt-sm">${inc.status} · ${App.timeAgo(inc.started)}</div>
          </div>
        `).join('')}
      </div>
      ` : `
      <div class="card">
        <div class="text-sm text-secondary" style="text-align:center;padding:var(--space-md)">
          <span class="mi" style="font-size:24px;display:block;margin-bottom:4px;color:var(--accent-green)">check_circle</span>
          No active incidents
        </div>
      </div>
      `}
    `;
  }

  let physicsEnabled = true;
  function togglePhysics() {
    physicsEnabled = !physicsEnabled;
    if (network) {
      network.setOptions({ physics: { enabled: physicsEnabled } });
    }
    const btn = document.getElementById('physics-btn');
    if (btn) {
      btn.innerHTML = `<span class="mi" style="font-size:14px">grain</span> Physics: ${physicsEnabled ? 'ON' : 'OFF'}`;
    }
  }

  function fitAll() {
    if (network) network.fit({ animation: true });
  }

  function destroy() {
    if (network) { network.destroy(); network = null; }
  }

  return { render, init, destroy, togglePhysics, fitAll };
})();
