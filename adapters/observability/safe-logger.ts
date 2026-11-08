import { activeTraceFields } from './tracing.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  readonly correlationId?: string;
  readonly [key: string]: unknown;
}

export interface SafeLogger {
  debug(event: string, context?: LogContext): void;
  info(event: string, context?: LogContext): void;
  warn(event: string, context?: LogContext): void;
  error(event: string, context?: LogContext): void;
}

const sensitiveKeyPattern =
  /authorization|cookie|email|phone|contact|password|secret|token|body|sql|query|url/i;
const levels: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

export function createSafeLogger(
  minimumLevel: LogLevel,
  write: (message: string) => void = console.log,
): SafeLogger {
  const minimumIndex = levels.indexOf(minimumLevel);

  function log(level: LogLevel, event: string, context: LogContext = {}): void {
    if (levels.indexOf(level) < minimumIndex) {
      return;
    }

    const safeContext = { ...context };
    delete safeContext.trace_id;
    delete safeContext.span_id;
    delete safeContext.trace_sampled;
    write(
      JSON.stringify({
        level,
        event,
        timestamp: new Date().toISOString(),
        context: redactContext({ ...safeContext, ...activeTraceFields() }),
      }),
    );
  }

  return {
    debug: (event, context) => {
      log('debug', event, context);
    },
    info: (event, context) => {
      log('info', event, context);
    },
    warn: (event, context) => {
      log('warn', event, context);
    },
    error: (event, context) => {
      log('error', event, context);
    },
  };
}

function redactContext(context: LogContext): Record<string, unknown> {
  const seen = new WeakSet<object>();
  function redact(value: unknown, key = ''): unknown {
    if (sensitiveKeyPattern.test(key)) return '[REDACTED]';
    if (typeof value === 'string') {
      return /https?:\/\/|[^\s@]+@[^\s@]+\.[^\s@]+|bearer\s|\beyJ[A-Za-z0-9_-]+\./i.test(value)
        ? '[REDACTED]'
        : value;
    }
    if (value === null || typeof value !== 'object') return value;
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);
    if (Array.isArray(value)) return value.map((item) => redact(item));
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, redact(child, childKey)]),
    );
  }
  return redact(context) as Record<string, unknown>;
}
