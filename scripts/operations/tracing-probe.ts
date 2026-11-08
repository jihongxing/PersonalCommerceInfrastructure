import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

function endpoint(value: string | undefined): URL {
  if (!value) throw new Error('Missing probe endpoint');
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('Invalid probe endpoint');
  return url;
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error('Missing response');
  const reader = response.body.getReader();
  let size = 0;
  let text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) throw new Error('Response too large');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } finally {
    void reader.cancel().catch(() => undefined);
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateAcknowledgement(value: unknown): void {
  if (!object(value)) throw new Error('Invalid collector response');
  if ('partialSuccess' in value && 'partial_success' in value)
    throw new Error('Invalid collector response');
  const partial = 'partialSuccess' in value ? value.partialSuccess : value.partial_success;
  if (partial === undefined) return;
  if (!object(partial)) throw new Error('Invalid collector response');
  if (
    ('rejectedSpans' in partial && 'rejected_spans' in partial) ||
    ('errorMessage' in partial && 'error_message' in partial)
  )
    throw new Error('Invalid collector response');
  const count =
    'rejectedSpans' in partial
      ? partial.rejectedSpans
      : 'rejected_spans' in partial
        ? partial.rejected_spans
        : '0';
  const message = 'errorMessage' in partial ? partial.errorMessage : partial.error_message;
  if (
    !(
      (typeof count === 'string' && /^\d+$/u.test(count)) ||
      (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0)
    ) ||
    (message !== undefined && typeof message !== 'string')
  )
    throw new Error('Invalid collector response');
  if (BigInt(count) !== 0n) throw new Error('Collector rejected probe');
}

function containsSpan(value: unknown, traceId: string, spanId: string): boolean {
  if (!object(value) || !Array.isArray(value.data)) return false;
  return value.data.some(
    (entry: unknown) =>
      object(entry) &&
      Array.isArray(entry.spans) &&
      entry.spans.some(
        (span: unknown) => object(span) && span.traceID === traceId && span.spanID === spanId,
      ),
  );
}

export async function runTracingProbe(env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const collector = endpoint(env.TRACING_PROBE_OTLP_URL);
  const query = endpoint(env.TRACING_PROBE_JAEGER_URL);
  const token = env.TRACING_PROBE_QUERY_TOKEN;
  const traceId = randomBytes(16).toString('hex');
  const spanId = randomBytes(8).toString('hex');
  const start = BigInt(Date.now()) * 1_000_000n;
  const signal = AbortSignal.timeout(30_000);
  const response = await fetch(collector, {
    method: 'POST',
    redirect: 'error',
    headers: { 'content-type': 'application/json' },
    signal,
    body: JSON.stringify({
      resourceSpans: [
        {
          resource: {
            attributes: [{ key: 'service.name', value: { stringValue: 'pci-tracing-probe' } }],
          },
          scopeSpans: [
            {
              spans: [
                {
                  traceId,
                  spanId,
                  name: 'tracing-probe',
                  kind: 1,
                  startTimeUnixNano: start.toString(),
                  endTimeUnixNano: (start + 1_000_000n).toString(),
                },
              ],
            },
          ],
        },
      ],
    }),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error('Collector rejected probe');
  }
  validateAcknowledgement(await readJson(response));
  if (!query.pathname.endsWith('/')) query.pathname += '/';
  const traceUrl = new URL(`api/traces/${traceId}`, query);
  while (!signal.aborted) {
    let result: Response | undefined;
    try {
      result = await fetch(traceUrl, {
        redirect: 'error',
        signal,
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
    } catch {
      if (signal.aborted) break;
    }
    if (result) {
      if (!result.ok) {
        await result.body?.cancel();
        if (result.status === 401 || result.status === 403)
          throw new Error('Trace query unauthorized');
      } else if (containsSpan(await readJson(result), traceId, spanId)) {
        return traceId;
      }
    }
    await new Promise<void>((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error('Trace query timed out');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runTracingProbe().then(
    (traceId) =>
      console.log(JSON.stringify({ event: 'tracing_probe_succeeded', trace_id: traceId })),
    () => {
      console.error(JSON.stringify({ event: 'tracing_probe_failed' }));
      process.exitCode = 1;
    },
  );
}
