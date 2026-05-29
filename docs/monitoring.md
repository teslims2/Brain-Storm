# Monitoring

> **See the full observability guide: [docs/observability.md](./observability.md)**

This document is superseded by the comprehensive observability documentation which covers distributed tracing (OpenTelemetry), metrics (Prometheus), log aggregation (Winston + Loki), alerting (Alertmanager), and Grafana dashboards.

## Quick Start

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

- Grafana:      http://localhost:3002 (admin/admin)
- Prometheus:   http://localhost:9090
- Alertmanager: http://localhost:9093
