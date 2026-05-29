# Observability

Brain-Storm uses a full observability stack: **distributed tracing** (OpenTelemetry), **metrics** (Prometheus), **log aggregation** (Winston + Loki), and **alerting** (Prometheus Alertmanager) — all visualized in **Grafana**.

---

## Quick Start

```bash
# Start the full monitoring stack
docker compose -f docker-compose.monitoring.yml up -d

# Access dashboards
# Grafana:      http://localhost:3002  (admin / admin)
# Prometheus:   http://localhost:9090
# Alertmanager: http://localhost:9093
# Loki:         http://localhost:3100
```

---

## Distributed Tracing (OpenTelemetry)

The backend auto-instruments HTTP, PostgreSQL, and Redis using the OpenTelemetry Node.js SDK.

### Configuration

| Env Var | Description | Default |
|---|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP trace collector URL | _(disabled)_ |

When `OTEL_EXPORTER_OTLP_ENDPOINT` is not set, tracing runs in no-op mode (zero overhead). Set it to send traces to Jaeger, Tempo, or any OTLP-compatible backend.

### Custom Spans

Inject `TracingService` to create custom spans:

```typescript
import { TracingService } from './tracing';

constructor(private tracing: TracingService) {}

async issueCredential(userId: string) {
  return this.tracing.withSpan('credential.issue', async (span) => {
    span.setAttribute('user.id', userId);
    // ... your logic
  });
}
```

---

## Metrics (Prometheus)

Metrics are exposed at `GET /metrics` (Prometheus scrape format).

### Available Metrics

| Metric | Type | Description |
|---|---|---|
| `http_requests_total` | Counter | HTTP requests by method, route, status_code |
| `http_request_duration_seconds` | Histogram | HTTP request duration |
| `credential_issued_total` | Counter | Credentials issued by type |
| `bst_minted_total` | Counter | BST tokens minted by user |
| `stellar_rpc_latency_seconds` | Histogram | Stellar RPC call latency |
| `enrollments_total` | Counter | Course enrollments by course_id |
| `course_completions_total` | Counter | Course completions by course_id |
| `auth_attempts_total` | Counter | Auth attempts by type and status |
| `active_connections` | Gauge | Active HTTP connections |
| `nodejs_heap_size_used_bytes` | Gauge | Node.js heap memory used |
| `nodejs_eventloop_lag_seconds` | Gauge | Event loop lag |

### Recording Business Metrics

```typescript
import { MetricsService } from './metrics/metrics.service';

// In your service
this.metricsService.incrementCredentialIssued('course-completion');
this.metricsService.incrementEnrollments(courseId);
this.metricsService.incrementAuthAttempts('login', 'success');
this.metricsService.observeStellarRpcLatency('submitTransaction', 'success', durationSeconds);
```

---

## Log Aggregation (Winston + Loki)

Structured JSON logs are written to stdout in production. Optionally shipped to Grafana Loki.

### Configuration

| Env Var | Description | Default |
|---|---|---|
| `LOG_LEVEL` | Minimum log level | `info` |
| `LOKI_URL` | Loki push URL | _(disabled)_ |

Set `LOKI_URL=http://loki:3100` to enable log shipping. Logs are batched and sent every 5 seconds with labels `app=brain-storm-backend` and `env=<NODE_ENV>`.

### Log Format

In production (`NODE_ENV=production`), logs are emitted as JSON:

```json
{
  "timestamp": "2026-05-29T18:00:00.000Z",
  "level": "info",
  "message": "Health check completed",
  "context": "HealthController",
  "status": "ok"
}
```

In development, logs use a human-readable colored format.

---

## Alerting (Prometheus + Alertmanager)

Alert rules are defined in `infra/monitoring/alerts.yml`.

### Alert Rules

| Alert | Severity | Condition |
|---|---|---|
| `HighErrorRate` | critical | 5xx rate > 5% for 2m |
| `SlowHttpResponses` | warning | p95 latency > 1s for 5m |
| `SlowStellarRpc` | warning | Stellar RPC p95 > 2s for 5m |
| `HighMemoryUsage` | warning | Heap > 400MB for 5m |
| `HighEventLoopLag` | warning | Event loop lag > 100ms for 2m |
| `ServiceDown` | critical | Backend unreachable for 1m |
| `HighAuthFailureRate` | warning | Auth failure rate > 30% for 5m |

### Alertmanager Configuration

Configure `ALERTMANAGER_WEBHOOK_URL` in `infra/monitoring/alertmanager.yml` to route alerts to Slack, PagerDuty, or any webhook receiver.

---

## Grafana Dashboards

Two dashboards are auto-provisioned at startup:

| Dashboard | Description |
|---|---|
| **Brain-Storm Overview** | Request rate, error rate, latency, business metrics, memory, event loop |
| **NestJS Metrics** | HTTP requests, credentials, BST tokens, Stellar RPC latency |

Access at `http://localhost:3002` (credentials: `admin` / `admin`).

---

## Infrastructure

```
docker-compose.monitoring.yml
├── prometheus    :9090  — metrics scraping + alerting rules
├── alertmanager  :9093  — alert routing and notification
├── loki          :3100  — log aggregation
└── grafana       :3002  — dashboards (Prometheus + Loki datasources)
```

Alert rules: `infra/monitoring/alerts.yml`  
Alertmanager config: `infra/monitoring/alertmanager.yml`  
Prometheus config: `infra/monitoring/prometheus.yml`  
Grafana dashboards: `infra/monitoring/grafana/dashboards/`
