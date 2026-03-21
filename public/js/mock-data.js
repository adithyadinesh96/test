/* ============================================================
   AI SRE Dashboard — Mock Data Generators
   ============================================================ */

const MockData = (() => {

  // --- Services ---
  const services = [
    { id: 'api-gateway',          name: 'API Gateway',          status: 'healthy',  latency: 45,  errorRate: 0.02, rpm: 8420 },
    { id: 'auth-service',         name: 'Auth Service',         status: 'healthy',  latency: 32,  errorRate: 0.01, rpm: 3200 },
    { id: 'user-service',         name: 'User Service',         status: 'healthy',  latency: 28,  errorRate: 0.03, rpm: 2100 },
    { id: 'payment-service',      name: 'Payment Service',      status: 'degraded', latency: 245, errorRate: 1.2,  rpm: 890  },
    { id: 'order-service',        name: 'Order Service',        status: 'healthy',  latency: 67,  errorRate: 0.08, rpm: 1540 },
    { id: 'inventory-service',    name: 'Inventory Service',    status: 'healthy',  latency: 51,  errorRate: 0.04, rpm: 1120 },
    { id: 'notification-service', name: 'Notification Service', status: 'healthy',  latency: 18,  errorRate: 0.01, rpm: 4300 },
    { id: 'search-service',       name: 'Search Service',       status: 'healthy',  latency: 89,  errorRate: 0.15, rpm: 2800 },
    { id: 'analytics-service',    name: 'Analytics Service',    status: 'degraded', latency: 312, errorRate: 0.9,  rpm: 560  },
    { id: 'cdn-edge',             name: 'CDN Edge',             status: 'healthy',  latency: 8,   errorRate: 0.00, rpm: 15200 },
    { id: 'db-primary',           name: 'DB Primary',           status: 'healthy',  latency: 12,  errorRate: 0.02, rpm: 9800 },
    { id: 'cache-redis',          name: 'Cache (Redis)',        status: 'healthy',  latency: 3,   errorRate: 0.00, rpm: 22400 },
  ];

  // --- Service topology edges ---
  const serviceEdges = [
    { from: 'cdn-edge', to: 'api-gateway' },
    { from: 'api-gateway', to: 'auth-service' },
    { from: 'api-gateway', to: 'user-service' },
    { from: 'api-gateway', to: 'order-service' },
    { from: 'api-gateway', to: 'search-service' },
    { from: 'order-service', to: 'payment-service' },
    { from: 'order-service', to: 'inventory-service' },
    { from: 'user-service', to: 'notification-service' },
    { from: 'auth-service', to: 'cache-redis' },
    { from: 'user-service', to: 'db-primary' },
    { from: 'order-service', to: 'db-primary' },
    { from: 'payment-service', to: 'db-primary' },
    { from: 'search-service', to: 'cache-redis' },
    { from: 'analytics-service', to: 'db-primary' },
    { from: 'api-gateway', to: 'analytics-service' },
  ];

  // --- Incidents ---
  const incidents = [
    {
      id: 'INC-2024-0847',
      title: 'Payment processing latency spike',
      severity: 'P1',
      status: 'investigating',
      service: 'payment-service',
      assignee: 'Sarah Chen',
      started: Date.now() - 35 * 60000,
      description: 'P99 latency for payment-service exceeded 500ms threshold. Customers experiencing slow checkout.',
      timeline: [
        { time: -35, text: 'Alert triggered: P99 latency > 500ms on payment-service', type: 'red' },
        { time: -32, text: 'On-call engineer Sarah Chen paged', type: 'yellow' },
        { time: -28, text: 'Investigation started — checking DB connection pool', type: 'blue' },
        { time: -15, text: 'Root cause identified: DB connection pool exhaustion due to long-running queries', type: 'yellow' },
        { time: -5,  text: 'Mitigation in progress: Killing long-running queries and scaling connection pool', type: 'blue' },
      ],
      rootCause: {
        summary: 'Database connection pool exhaustion caused by unoptimized analytics query running against the primary database.',
        confidence: 94,
        factors: [
          'analytics-service running full table scan on orders table (started 40 min ago)',
          'DB primary connection pool at 98% capacity (normal: 35%)',
          'payment-service queries timing out waiting for connections',
          'No read replica configured for analytics workloads'
        ],
        runbook: [
          'Kill the long-running analytics query: SELECT pg_terminate_backend(pid) WHERE duration > 300s',
          'Scale the connection pool from 50 to 100 connections temporarily',
          'Route analytics-service to read replica (config update in k8s/analytics-deployment.yaml)',
          'Add query timeout of 60s to analytics-service database config',
          'Post-incident: Set up separate read replica for analytics workloads'
        ]
      }
    },
    {
      id: 'INC-2024-0846',
      title: 'Elevated 5xx errors on API Gateway',
      severity: 'P2',
      status: 'mitigating',
      service: 'api-gateway',
      assignee: 'Mike Torres',
      started: Date.now() - 90 * 60000,
      description: 'Error rate on api-gateway increased to 2.3% (threshold: 1%). Mostly 502 Bad Gateway responses.',
      timeline: [
        { time: -90, text: 'Alert triggered: Error rate > 1% on api-gateway', type: 'red' },
        { time: -85, text: 'On-call Mike Torres acknowledged', type: 'yellow' },
        { time: -70, text: 'Correlated with deployment deploy-v2.14.3 at 14:02 UTC', type: 'blue' },
        { time: -45, text: 'Rollback initiated to v2.14.2', type: 'yellow' },
        { time: -30, text: 'Rollback complete. Error rate dropping.', type: 'green' },
      ],
      rootCause: {
        summary: 'Deployment v2.14.3 introduced a misconfigured connection timeout that caused upstream services to be marked unhealthy.',
        confidence: 87,
        factors: [
          'Deployment v2.14.3 changed upstream timeout from 30s to 3s',
          'search-service and analytics-service P99 latency > 3s → marked unhealthy',
          '502 errors served when no healthy upstreams available',
        ],
        runbook: [
          'Verify rollback completed: kubectl rollout status deployment/api-gateway',
          'Check current error rates across all endpoints',
          'Review PR #4821 that introduced the timeout change',
          'Add integration test for upstream timeout configuration',
        ]
      }
    },
    {
      id: 'INC-2024-0845',
      title: 'Redis cache hit ratio drop',
      severity: 'P3',
      status: 'resolved',
      service: 'cache-redis',
      assignee: 'Priya Sharma',
      started: Date.now() - 6 * 3600000,
      resolved: Date.now() - 4 * 3600000,
      description: 'Cache hit ratio dropped from 95% to 62%, causing increased load on DB primary.',
      timeline: [
        { time: -360, text: 'Alert: Cache hit ratio < 80%', type: 'yellow' },
        { time: -340, text: 'Priya Sharma investigating', type: 'blue' },
        { time: -300, text: 'Found: TTL misconfiguration after config update', type: 'yellow' },
        { time: -260, text: 'Config corrected, cache warming initiated', type: 'blue' },
        { time: -240, text: 'Hit ratio recovered to 94%. Incident resolved.', type: 'green' },
      ],
      rootCause: {
        summary: 'Configuration update accidentally set cache TTL to 5 seconds instead of 5 minutes for user session data.',
        confidence: 98,
        factors: [
          'Config change deployed at 08:15 UTC set SESSION_CACHE_TTL=5 (seconds) instead of SESSION_CACHE_TTL=300',
          'Cache entries expiring 60x faster than intended',
          'DB primary read load increased by 340%',
        ],
        runbook: [
          'Fix TTL value in config/redis.yaml: SESSION_CACHE_TTL=300',
          'Run cache warming script: ./scripts/warm-cache.sh --sessions',
          'Add config validation to CI pipeline for critical TTL values',
        ]
      }
    },
    {
      id: 'INC-2024-0844',
      title: 'Search service timeout errors',
      severity: 'P2',
      status: 'resolved',
      service: 'search-service',
      assignee: 'James Liu',
      started: Date.now() - 12 * 3600000,
      resolved: Date.now() - 10 * 3600000,
      description: 'Search queries timing out. Elasticsearch cluster under heavy load.',
      timeline: [
        { time: -720, text: 'Alert: search-service P99 > 2s', type: 'red' },
        { time: -700, text: 'James Liu paged and investigating', type: 'yellow' },
        { time: -660, text: 'ES cluster CPU at 95%. Index rebalancing in progress.', type: 'blue' },
        { time: -620, text: 'Scaled ES cluster from 3 to 5 nodes', type: 'blue' },
        { time: -600, text: 'Latency recovered. Resolved.', type: 'green' },
      ],
      rootCause: {
        summary: 'Elasticsearch shard rebalancing triggered by adding new index consumed excessive CPU, causing search timeouts.',
        confidence: 91,
        factors: [
          'New product catalog index created with 20 shards',
          'Shard rebalancing consuming 90%+ CPU on 2 of 3 nodes',
          'Query queue depth exceeded 500',
        ],
        runbook: [
          'Disable automatic shard rebalancing during peak hours',
          'Scale ES cluster before adding large indices',
          'Set cluster.routing.allocation.cluster_concurrent_rebalance=1',
        ]
      }
    },
    {
      id: 'INC-2024-0843',
      title: 'Notification delivery delays',
      severity: 'P3',
      status: 'resolved',
      service: 'notification-service',
      assignee: 'Ana Petrov',
      started: Date.now() - 24 * 3600000,
      resolved: Date.now() - 22 * 3600000,
      description: 'Email and push notifications delayed by 15-30 minutes.',
      timeline: [],
      rootCause: { summary: 'Message queue backlog due to upstream spike.', confidence: 85, factors: [], runbook: [] }
    },
    {
      id: 'INC-2024-0842',
      title: 'CDN origin failover activated',
      severity: 'P1',
      status: 'resolved',
      service: 'cdn-edge',
      assignee: 'Sarah Chen',
      started: Date.now() - 48 * 3600000,
      resolved: Date.now() - 46 * 3600000,
      description: 'Primary CDN origin became unreachable. Failover to secondary activated.',
      timeline: [],
      rootCause: { summary: 'Network partition between CDN edge and origin DC.', confidence: 76, factors: [], runbook: [] }
    },
    {
      id: 'INC-2024-0841',
      title: 'Database replication lag > 30s',
      severity: 'P2',
      status: 'resolved',
      service: 'db-primary',
      assignee: 'Mike Torres',
      started: Date.now() - 72 * 3600000,
      resolved: Date.now() - 70 * 3600000,
      description: 'Replication lag between primary and replica exceeded 30 seconds.',
      timeline: [],
      rootCause: { summary: 'Heavy write load from batch import job saturated WAL sender.', confidence: 82, factors: [], runbook: [] }
    },
    {
      id: 'INC-2024-0840',
      title: 'Memory leak in user-service',
      severity: 'P3',
      status: 'resolved',
      service: 'user-service',
      assignee: 'James Liu',
      started: Date.now() - 96 * 3600000,
      resolved: Date.now() - 93 * 3600000,
      description: 'user-service pods OOMKilled repeatedly. Memory increasing linearly over 12 hours.',
      timeline: [],
      rootCause: { summary: 'Unclosed DB connections in session handler causing memory growth.', confidence: 95, factors: [], runbook: [] }
    },
  ];

  // --- Alerts ---
  const alertRules = [
    { id: 1, name: 'High Error Rate',           condition: 'error_rate > 1%',      service: 'api-gateway',       status: 'active',   severity: 'critical', lastFired: Date.now() - 90*60000 },
    { id: 2, name: 'P99 Latency Spike',         condition: 'p99_latency > 500ms',  service: 'payment-service',   status: 'firing',   severity: 'critical', lastFired: Date.now() - 35*60000 },
    { id: 3, name: 'CPU Utilization High',       condition: 'cpu_usage > 85%',      service: '*',                 status: 'active',   severity: 'warning',  lastFired: Date.now() - 4*3600000 },
    { id: 4, name: 'Memory Usage Critical',      condition: 'memory_usage > 90%',   service: '*',                 status: 'active',   severity: 'critical', lastFired: Date.now() - 24*3600000 },
    { id: 5, name: 'Disk Space Low',             condition: 'disk_usage > 80%',     service: 'db-primary',        status: 'active',   severity: 'warning',  lastFired: Date.now() - 6*3600000 },
    { id: 6, name: 'Cache Hit Ratio Low',        condition: 'hit_ratio < 80%',      service: 'cache-redis',       status: 'active',   severity: 'warning',  lastFired: Date.now() - 6*3600000 },
    { id: 7, name: 'Replication Lag',            condition: 'repl_lag > 10s',       service: 'db-primary',        status: 'active',   severity: 'critical', lastFired: Date.now() - 72*3600000 },
    { id: 8, name: 'Pod Restart Loop',           condition: 'restarts > 3 in 10m',  service: '*',                 status: 'muted',    severity: 'warning',  lastFired: Date.now() - 96*3600000 },
    { id: 9, name: 'SSL Certificate Expiry',     condition: 'cert_days_left < 30',  service: 'cdn-edge',          status: 'active',   severity: 'info',     lastFired: null },
    { id: 10, name: 'Request Queue Depth',       condition: 'queue_depth > 500',    service: 'search-service',    status: 'active',   severity: 'warning',  lastFired: Date.now() - 12*3600000 },
  ];

  // --- On-call schedule ---
  const oncallSchedule = [
    { name: 'Sarah Chen',   avatar: 'SC', color: '#3b82f6', shift: 'Mon 09:00 – Tue 09:00', current: false },
    { name: 'Mike Torres',  avatar: 'MT', color: '#10b981', shift: 'Tue 09:00 – Wed 09:00', current: false },
    { name: 'Priya Sharma', avatar: 'PS', color: '#f59e0b', shift: 'Wed 09:00 – Thu 09:00', current: false },
    { name: 'James Liu',    avatar: 'JL', color: '#8b5cf6', shift: 'Thu 09:00 – Fri 09:00', current: true },
    { name: 'Ana Petrov',   avatar: 'AP', color: '#ef4444', shift: 'Fri 09:00 – Mon 09:00', current: false },
  ];

  // --- AI Insights ---
  const anomalies = [
    {
      id: 1,
      title: 'Unusual traffic pattern detected on API Gateway',
      description: 'Request volume increased 340% in the last 15 minutes without a corresponding marketing event or deployment. Pattern suggests potential DDoS or bot activity.',
      confidence: 92,
      severity: 'high',
      metric: 'request_rate',
      service: 'api-gateway',
      detected: Date.now() - 12 * 60000,
    },
    {
      id: 2,
      title: 'Memory usage trend predicts OOM in user-service',
      description: 'Linear memory growth pattern detected. At current rate, user-service pods will hit OOM limits within approximately 4 hours. Similar pattern preceded INC-2024-0840.',
      confidence: 87,
      severity: 'medium',
      metric: 'memory_usage',
      service: 'user-service',
      detected: Date.now() - 45 * 60000,
    },
    {
      id: 3,
      title: 'Error rate correlation with deployment',
      description: 'Error rate on api-gateway shows strong correlation (r=0.94) with deployment deploy-v2.14.3 at 14:02 UTC. Recommend investigating recent code changes.',
      confidence: 94,
      severity: 'high',
      metric: 'error_rate',
      service: 'api-gateway',
      detected: Date.now() - 88 * 60000,
    },
    {
      id: 4,
      title: 'Disk I/O latency anomaly on DB Primary',
      description: 'Write latency on db-primary increased from 2ms to 8ms baseline. Not correlated with increased traffic. Possible hardware degradation or noisy neighbor.',
      confidence: 78,
      severity: 'low',
      metric: 'disk_io_latency',
      service: 'db-primary',
      detected: Date.now() - 3 * 3600000,
    },
  ];

  const predictions = [
    { title: 'Disk space on db-primary will reach 90% in ~6 hours', impact: 'high', eta: '6h', icon: '&#xe2c1;' },
    { title: 'SSL certificate for cdn-edge expires in 23 days', impact: 'medium', eta: '23d', icon: '&#xe897;' },
    { title: 'Payment-service pod count may need scaling by Monday', impact: 'medium', eta: '3d', icon: '&#xe8a1;' },
    { title: 'Cache eviction rate trending up — possible config drift', impact: 'low', eta: '12h', icon: '&#xe86c;' },
  ];

  const recommendations = [
    { title: 'Route analytics queries to read replica', impact: 92, description: 'analytics-service is running heavy queries against db-primary. Redirecting to a read replica would reduce primary load by ~35% and prevent connection pool exhaustion incidents.' },
    { title: 'Add circuit breaker to payment-service', impact: 85, description: 'payment-service has no circuit breaker pattern. When downstream payment provider is slow, it cascades into connection exhaustion. Adding a circuit breaker with a 5s timeout would contain failures.' },
    { title: 'Implement request rate limiting on API Gateway', impact: 78, description: 'No rate limiting configured. The detected traffic anomaly could have been mitigated automatically with a rate limit of 10K req/s per IP.' },
    { title: 'Set up automated canary deployments', impact: 71, description: 'Recent incidents correlated with deployments. Canary deployment with automated rollback on error rate spike would reduce blast radius of bad deploys.' },
    { title: 'Add horizontal pod autoscaler to search-service', impact: 65, description: 'search-service scales manually. Adding HPA based on CPU/memory would prevent the timeout issues seen in INC-2024-0844.' },
  ];

  // --- Time-series generator ---
  function generateTimeSeries(points, base, variance, trend = 0, spikeProbability = 0.02) {
    const data = [];
    const now = Date.now();
    const interval = 60000; // 1 minute
    let value = base;
    for (let i = points; i >= 0; i--) {
      value = base + trend * (points - i) / points;
      value += (Math.random() - 0.5) * variance * 2;
      if (Math.random() < spikeProbability) {
        value += variance * (2 + Math.random() * 3);
      }
      value = Math.max(0, value);
      data.push({ x: now - i * interval, y: Math.round(value * 100) / 100 });
    }
    return data;
  }

  // --- Log generator ---
  const logMessages = {
    error: [
      'Connection refused to downstream service',
      'Request timeout after 30000ms',
      'Failed to process payment: card declined',
      'Database query failed: connection pool exhausted',
      'OutOfMemoryError: Java heap space',
      'SSL handshake failed: certificate expired',
      'Rate limit exceeded for client 10.0.4.52',
      'Failed to serialize response: circular reference',
      'Unhandled exception in request handler',
      'Health check failed: service unhealthy',
    ],
    warn: [
      'Slow query detected: 2340ms (threshold: 1000ms)',
      'Connection pool utilization at 85%',
      'Retry attempt 2/3 for upstream request',
      'Cache miss ratio above threshold: 28%',
      'Response time degraded: P99 at 450ms',
      'Disk usage at 78% on /data volume',
      'Thread pool near capacity: 47/50 threads active',
      'Deprecated API version v1 called by client',
      'Certificate expires in 25 days',
      'Memory usage at 82% of limit',
    ],
    info: [
      'Request processed successfully in 45ms',
      'User authentication successful',
      'Cache hit for session data',
      'Deployment v2.14.2 rollout complete',
      'Health check passed',
      'New connection established to db-primary',
      'Background job completed: cleanup_sessions',
      'Config reload triggered',
      'Pod scaled up: replicas 3 → 4',
      'TLS certificate renewed successfully',
    ],
    debug: [
      'Entering middleware: auth-validator',
      'Query plan: Sequential scan on users table',
      'Cache key generated: user:session:a8f2c',
      'HTTP/2 stream opened: stream_id=47',
      'Connection keepalive ping sent',
      'Garbage collection: freed 128MB',
      'Request context created: trace_id=abc123',
      'Middleware chain completed in 2ms',
    ],
  };

  function generateLogEntry() {
    const levels = ['error', 'warn', 'info', 'info', 'info', 'debug', 'debug'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const svc = services[Math.floor(Math.random() * services.length)];
    const msgs = logMessages[level];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    return {
      timestamp: new Date(),
      level,
      service: svc.id,
      message: msg,
      traceId: Math.random().toString(36).substring(2, 14),
    };
  }

  function generateLogBatch(count) {
    const logs = [];
    for (let i = 0; i < count; i++) {
      logs.push(generateLogEntry());
    }
    return logs.sort((a, b) => a.timestamp - b.timestamp);
  }

  // --- Alert history generator ---
  function generateAlertHistory(hours = 24) {
    const data = [];
    const now = Date.now();
    for (let h = hours; h >= 0; h--) {
      const t = now - h * 3600000;
      const count = Math.floor(Math.random() * 5) + (h > 18 && h < 22 ? 8 : 0);
      data.push({ x: t, y: count });
    }
    return data;
  }

  // --- Public API ---
  return {
    services,
    serviceEdges,
    incidents,
    alertRules,
    oncallSchedule,
    anomalies,
    predictions,
    recommendations,
    generateTimeSeries,
    generateLogEntry,
    generateLogBatch,
    generateAlertHistory,
  };
})();
