import { Injectable, OnModuleInit } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDuration: Histogram;
  private readonly credentialIssuedTotal: Counter;
  private readonly bstMintedTotal: Counter;
  private readonly stellarRpcLatency: Histogram;
  private readonly activeConnections: Gauge;
  private readonly enrollmentsTotal: Counter;
  private readonly courseCompletionsTotal: Counter;
  private readonly authAttemptsTotal: Counter;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [register],
    });

    this.credentialIssuedTotal = new Counter({
      name: 'credential_issued_total',
      help: 'Total number of credentials issued',
      labelNames: ['credential_type'],
      registers: [register],
    });

    this.bstMintedTotal = new Counter({
      name: 'bst_minted_total',
      help: 'Total number of BST tokens minted',
      labelNames: ['user_id'],
      registers: [register],
    });

    this.stellarRpcLatency = new Histogram({
      name: 'stellar_rpc_latency_seconds',
      help: 'Stellar RPC call latency in seconds',
      labelNames: ['method', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [register],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active HTTP connections',
      registers: [register],
    });

    this.enrollmentsTotal = new Counter({
      name: 'enrollments_total',
      help: 'Total number of course enrollments',
      labelNames: ['course_id'],
      registers: [register],
    });

    this.courseCompletionsTotal = new Counter({
      name: 'course_completions_total',
      help: 'Total number of course completions',
      labelNames: ['course_id'],
      registers: [register],
    });

    this.authAttemptsTotal = new Counter({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['type', 'status'],
      registers: [register],
    });
  }

  onModuleInit() {
    // Metrics are registered in constructor; nothing extra needed
  }

  incrementHttpRequests(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
  }

  observeHttpDuration(method: string, route: string, statusCode: number, durationSeconds: number) {
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, durationSeconds);
  }

  incrementCredentialIssued(credentialType: string) {
    this.credentialIssuedTotal.inc({ credential_type: credentialType });
  }

  incrementBstMinted(userId: string) {
    this.bstMintedTotal.inc({ user_id: userId });
  }

  observeStellarRpcLatency(method: string, status: string, durationSeconds: number) {
    this.stellarRpcLatency.observe({ method, status }, durationSeconds);
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  incrementEnrollments(courseId: string) {
    this.enrollmentsTotal.inc({ course_id: courseId });
  }

  incrementCourseCompletions(courseId: string) {
    this.courseCompletionsTotal.inc({ course_id: courseId });
  }

  incrementAuthAttempts(type: 'login' | 'register' | 'refresh', status: 'success' | 'failure') {
    this.authAttemptsTotal.inc({ type, status });
  }
}
