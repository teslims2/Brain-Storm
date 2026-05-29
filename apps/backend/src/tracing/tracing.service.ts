import { Injectable } from '@nestjs/common';
import { trace, context, SpanStatusCode, Span, Tracer } from '@opentelemetry/api';

@Injectable()
export class TracingService {
  private readonly tracer: Tracer;

  constructor() {
    this.tracer = trace.getTracer('brain-storm-backend', '1.0.0');
  }

  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
    const span = this.tracer.startSpan(name);
    if (attributes) {
      span.setAttributes(attributes);
    }
    return span;
  }

  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>,
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, { attributes }, async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  getCurrentSpan(): Span | undefined {
    return trace.getActiveSpan();
  }

  addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.setAttributes(attributes);
    }
  }
}
