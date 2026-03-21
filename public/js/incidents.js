/* ============================================================
   AI SRE Dashboard — Incident Management Page
   ============================================================ */

const IncidentsPage = (() => {
  let filter = 'all';

  function render() {
    const incidents = getFiltered();
    const active = MockData.incidents.filter(i => i.status !== 'resolved').length;
    const investigating = MockData.incidents.filter(i => i.status === 'investigating').length;
    const resolved = MockData.incidents.filter(i => i.status === 'resolved').length;
    const mttr = '1h 42m';

    return `
      <div class="flex-between mb-md">
        <div>
          <h1 class="page-title">Incident Management</h1>
          <p class="page-subtitle">Track, investigate, and resolve incidents</p>
        </div>
        <button class="btn btn-primary" onclick="IncidentsPage.createIncident()">
          <span class="mi" style="font-size:16px">add</span> Declare Incident
        </button>
      </div>

      <!-- Stats -->
      <div class="grid-4 mb-lg">
        <div class="kpi-card red">
          <div class="kpi-label">Active Incidents</div>
          <div class="kpi-value text-red">${active}</div>
        </div>
        <div class="kpi-card yellow">
          <div class="kpi-label">Investigating</div>
          <div class="kpi-value text-yellow">${investigating}</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-label">Resolved (7d)</div>
          <div class="kpi-value text-green">${resolved}</div>
        </div>
        <div class="kpi-card blue">
          <div class="kpi-label">Avg MTTR</div>
          <div class="kpi-value">${mttr}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex-center gap-sm mb-md">
        <button class="filter-chip ${filter==='all'?'active':''}" onclick="IncidentsPage.setFilter('all')">All</button>
        <button class="filter-chip ${filter==='active'?'active':''}" onclick="IncidentsPage.setFilter('active')">
          <span class="chip-dot" style="background:var(--accent-red)"></span> Active
        </button>
        <button class="filter-chip ${filter==='resolved'?'active':''}" onclick="IncidentsPage.setFilter('resolved')">
          <span class="chip-dot" style="background:var(--accent-green)"></span> Resolved
        </button>
      </div>

      <!-- Incident Table -->
      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Severity</th>
              <th>Title</th>
              <th>Service</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Duration</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${incidents.map(inc => {
              const duration = inc.resolved
                ? App.formatDuration(inc.resolved - inc.started)
                : App.formatDuration(Date.now() - inc.started);
              const statusClass = inc.status === 'resolved' ? 'badge-healthy' :
                                  inc.status === 'investigating' ? 'badge-down' : 'badge-degraded';
              return `
                <tr class="clickable" onclick="IncidentsPage.showDetail('${inc.id}')">
                  <td><code style="color:var(--text-tertiary)">${inc.id}</code></td>
                  <td><span class="badge severity-${inc.severity.toLowerCase()}">${inc.severity}</span></td>
                  <td style="font-weight:500">${inc.title}</td>
                  <td><span class="text-secondary">${inc.service}</span></td>
                  <td><span class="badge ${statusClass}">${inc.status}</span></td>
                  <td>${inc.assignee}</td>
                  <td class="text-secondary">${duration}</td>
                  <td><span class="mi text-secondary" style="font-size:16px">chevron_right</span></td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function getFiltered() {
    if (filter === 'active') return MockData.incidents.filter(i => i.status !== 'resolved');
    if (filter === 'resolved') return MockData.incidents.filter(i => i.status === 'resolved');
    return MockData.incidents;
  }

  function setFilter(f) {
    filter = f;
    document.getElementById('page-content').innerHTML = render();
  }

  function showDetail(id) {
    const inc = MockData.incidents.find(i => i.id === id);
    if (!inc) return;

    const duration = inc.resolved
      ? App.formatDuration(inc.resolved - inc.started)
      : App.formatDuration(Date.now() - inc.started);

    const body = `
      <div style="margin-bottom:var(--space-lg)">
        <div class="flex-center gap-sm mb-md">
          <span class="badge severity-${inc.severity.toLowerCase()}">${inc.severity}</span>
          <span class="badge ${inc.status==='resolved'?'badge-healthy':'badge-degraded'}">${inc.status}</span>
          <span class="text-sm text-secondary">Duration: ${duration}</span>
          <span class="text-sm text-secondary">· Assignee: ${inc.assignee}</span>
        </div>
        <p class="text-secondary" style="font-size:13px;line-height:1.6">${inc.description}</p>
      </div>

      ${inc.timeline && inc.timeline.length > 0 ? `
      <!-- Timeline -->
      <div class="mb-lg">
        <h4 style="font-size:14px;font-weight:600;margin-bottom:var(--space-md)">
          <span class="mi" style="font-size:16px;vertical-align:middle;margin-right:4px">timeline</span>
          Incident Timeline
        </h4>
        <div class="timeline">
          ${inc.timeline.map(t => `
            <div class="timeline-item">
              <div class="timeline-dot ${t.type}"></div>
              <div class="timeline-time">${Math.abs(t.time)}m ago</div>
              <div class="timeline-text">${t.text}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${inc.rootCause ? `
      <!-- AI Root Cause Analysis -->
      <div class="insight-card mb-lg">
        <div class="flex-between mb-sm">
          <h4 style="font-size:14px;font-weight:600">
            <span class="mi" style="font-size:16px;vertical-align:middle;margin-right:4px">auto_awesome</span>
            AI Root Cause Analysis
          </h4>
          <span class="insight-confidence">${inc.rootCause.confidence}% confidence</span>
        </div>
        <p style="font-size:13px;color:var(--text-primary);line-height:1.6;margin-bottom:var(--space-md)">
          ${inc.rootCause.summary}
        </p>
        ${inc.rootCause.factors.length > 0 ? `
        <div class="mb-md">
          <div class="text-sm" style="font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-xs)">Contributing Factors:</div>
          <ul style="list-style:none;padding:0">
            ${inc.rootCause.factors.map(f => `
              <li style="font-size:12px;color:var(--text-secondary);padding:4px 0;display:flex;align-items:baseline;gap:6px">
                <span class="mi" style="font-size:12px;color:var(--accent-yellow);flex-shrink:0">arrow_right</span>
                ${f}
              </li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        ${inc.rootCause.runbook.length > 0 ? `
        <div>
          <div class="text-sm" style="font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-xs)">
            <span class="mi" style="font-size:14px;vertical-align:middle;margin-right:2px">menu_book</span>
            AI-Suggested Runbook:
          </div>
          <ol style="padding-left:20px">
            ${inc.rootCause.runbook.map(r => `
              <li style="font-size:12px;color:var(--text-secondary);padding:4px 0;line-height:1.5">
                <code style="background:var(--bg-input);padding:2px 6px;border-radius:3px;font-size:11px">${r}</code>
              </li>
            `).join('')}
          </ol>
        </div>
        ` : ''}
      </div>
      ` : ''}
    `;

    App.openModal(inc.title, `${inc.id} · ${inc.service}`, body);
  }

  function createIncident() {
    App.openModal('Declare New Incident', 'Create a new incident report', `
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div>
          <label style="font-size:12px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:4px">Title</label>
          <input type="text" placeholder="Brief description of the incident" style="width:100%;background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-sm);padding:10px 14px;color:var(--text-primary);font-size:13px;outline:none">
        </div>
        <div class="grid-2" style="gap:var(--space-md)">
          <div>
            <label style="font-size:12px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:4px">Severity</label>
            <select style="width:100%;background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-sm);padding:10px 14px;color:var(--text-primary);font-size:13px;outline:none">
              <option>P1 - Critical</option><option>P2 - High</option><option>P3 - Medium</option><option>P4 - Low</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:4px">Service</label>
            <select style="width:100%;background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-sm);padding:10px 14px;color:var(--text-primary);font-size:13px;outline:none">
              ${MockData.services.map(s => `<option>${s.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:4px">Description</label>
          <textarea rows="3" placeholder="What is happening? What is the user impact?" style="width:100%;background:var(--bg-input);border:1px solid var(--border-primary);border-radius:var(--radius-sm);padding:10px 14px;color:var(--text-primary);font-size:13px;outline:none;resize:vertical"></textarea>
        </div>
        <div class="flex-center gap-sm" style="justify-content:flex-end;margin-top:var(--space-sm)">
          <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-danger" onclick="App.closeModal()">Declare Incident</button>
        </div>
      </div>
    `);
  }

  function init() {}
  function destroy() {}

  return { render, init, destroy, setFilter, showDetail, createIncident };
})();
