import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const browse = process.env.TRACING_BROWSE_EXECUTABLE;
if (!browse) throw new Error('Set TRACING_BROWSE_EXECUTABLE to the gstack browse executable.');
const execute = promisify(execFile);
const secret = 'tracing-browser-test-secret-32-bytes-long';
const jaeger = 'http://127.0.0.1:16686';

async function command(...args) {
  try {
    const { stdout } = await execute(browse, args, { timeout: 15000, maxBuffer: 1024 * 1024 });
    return stdout.trim();
  } catch {
    throw new Error(`browse ${args[0]} failed`);
  }
}

async function evaluate(expression) {
  return JSON.parse(await command('js', `JSON.stringify(${expression})`));
}

function requestContext(request) {
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-01$/u.exec(request.traceparent ?? '');
  assert.ok(match, 'request is missing a valid sampled traceparent');
  return { traceId: match[1], spanId: match[2] };
}

async function waitForTrace(traceId, predicate) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const response = await globalThis.fetch(`${jaeger}/api/traces/${traceId}`, {
      signal: globalThis.AbortSignal.timeout(2000),
    });
    if (response.ok) {
      const result = await response.json();
      const item = result.data?.[0];
      if (item && predicate(item.spans)) return item;
    }
    await delay(250);
  }
  throw new Error(`Trace ${traceId} did not contain the expected spans within 20 seconds`);
}

function hasReference(span, context, refType) {
  return span.references.some(
    (reference) =>
      reference.refType === refType &&
      reference.traceID === context.traceId &&
      reference.spanID === context.spanId,
  );
}

function tag(span, key) {
  return span.tags.find((item) => item.key === key)?.value;
}

async function traceForRequest(request) {
  const context = requestContext(request);
  const trace = await waitForTrace(
    context.traceId,
    (spans) =>
      spans.some((span) => span.spanID === context.spanId) &&
      spans.some(
        (span) => tag(span, 'span.kind') === 'server' && hasReference(span, context, 'CHILD_OF'),
      ),
  );
  const browser = trace.spans.find((span) => span.spanID === context.spanId);
  assert.equal(tag(browser, 'span.kind'), 'client');
  assert.equal(tag(browser, 'http.response.status_code'), request.status);
  assert.ok(browser.duration >= 0);
  return { context, trace, browser };
}

let tab;
try {
  const opened = await command('newtab', 'http://localhost:13000/e2e/tracing-harness/');
  tab = /Opened tab (\d+)/u.exec(opened)?.[1];
  assert.ok(tab, 'browse did not report the new tab');
  const signup = await evaluate('await window.traceHarness.signup()');
  assert.equal(signup.authenticated, true);
  assert.equal(signup.requests.length, 1);
  assert.equal(signup.requests[0].status, 201);
  const sensitive = await evaluate('window.traceHarness.sensitiveValues()');
  assert.equal(sensitive.length, 4);

  const concurrent = await evaluate(
    `await window.traceHarness.concurrentExpired(${JSON.stringify(secret)})`,
  );
  assert.deepEqual(concurrent.statuses, [200, 200]);
  assert.equal(concurrent.requests.length, 5);
  const originals = concurrent.requests.filter((item) => item.status === 401);
  const refreshes = concurrent.requests.filter((item) => item.path === '/api/v1/auth/refresh');
  const retries = concurrent.requests.filter(
    (item) => item.path === '/api/v1/creator/identity' && item.status === 200,
  );
  assert.equal(originals.length, 2);
  assert.equal(refreshes.length, 1);
  assert.equal(refreshes[0].status, 200);
  assert.equal(retries.length, 2);
  const refreshedSecrets = await evaluate('window.traceHarness.sensitiveValues()');
  sensitive.push(...refreshedSecrets);
  const pathMarker = 'tracing-result-access-private-marker';
  const queryMarker = 'tracing-query-token-private-marker';
  const privatePath = await evaluate(
    `await window.traceHarness.privateResultPath(${JSON.stringify(pathMarker)}, ${JSON.stringify(queryMarker)})`,
  );
  assert.equal(privatePath.status, 404);
  assert.equal(privatePath.requests.length, 1);
  sensitive.push(pathMarker, queryMarker);
  const flush = await evaluate('await window.traceHarness.pagehideFlush()');
  assert.ok(flush.batches.length > 0, 'pagehide did not initiate a batch');
  const cancelledWaiter = await evaluate(
    `await window.traceHarness.cancelRefreshWaiter(${JSON.stringify(secret)})`,
  );
  assert.deepEqual(cancelledWaiter.statuses, [0, 200]);
  const cancelledOriginals = cancelledWaiter.requests.filter((item) => item.status === 401);
  const cancelledRefresh = cancelledWaiter.requests.filter(
    (item) => item.path === '/api/v1/auth/refresh',
  );
  assert.equal(cancelledOriginals.length, 2);
  assert.equal(cancelledRefresh.length, 1);
  const remainingRetries = cancelledWaiter.requests.filter(
    (item) => item.path === '/api/v1/creator/identity' && item.status === 200,
  );
  assert.equal(remainingRetries.length, 1);
  sensitive.push(...(await evaluate('window.traceHarness.sensitiveValues()')));
  await evaluate(`await window.traceHarness.startRefreshTimeout(${JSON.stringify(secret)})`);
  let timeout;
  const timeoutDeadline = Date.now() + 22000;
  while (!timeout && Date.now() < timeoutDeadline) {
    await delay(500);
    timeout = await evaluate('await window.traceHarness.finishRefreshTimeout()');
  }
  assert.ok(timeout, 'shared refresh did not time out');
  assert.equal(timeout.status, 0);
  assert.equal(timeout.sessionUnchanged, true);
  assert.equal(timeout.lateSessionUnchanged, true);
  const timeoutOriginal = timeout.requests.find((item) => item.status === 401);
  const timeoutRefresh = timeout.requests.find((item) => item.path === '/api/v1/auth/refresh');
  assert.ok(timeoutOriginal && timeoutRefresh);
  assert.equal(timeoutRefresh.status, 200);
  const rejected = await evaluate('await window.traceHarness.rejectedRefresh()');
  assert.equal(rejected.result, false);
  assert.equal(rejected.requests.length, 1);
  assert.equal(rejected.requests[0].status, 401);
  sensitive.push('invalid-acceptance-refresh-token');

  const signupContext = requestContext(signup.requests[0]);
  const signupTrace = await waitForTrace(
    signupContext.traceId,
    (spans) =>
      spans.some((span) => span.spanID === signupContext.spanId) &&
      spans.some(
        (span) =>
          tag(span, 'span.kind') === 'server' && hasReference(span, signupContext, 'CHILD_OF'),
      ) &&
      [
        'auth.signup',
        'auth.session.create',
        'auth.workspace.initialize',
        'postgres.account.create',
        'postgres.transaction',
      ].every((name) => spans.some((span) => span.operationName === name)),
  );
  const signupServer = signupTrace.spans.find(
    (span) => tag(span, 'span.kind') === 'server' && hasReference(span, signupContext, 'CHILD_OF'),
  );
  const childOf = (childName, parent) => {
    const child = signupTrace.spans.find((span) => span.operationName === childName);
    assert.ok(
      child &&
        hasReference(child, { traceId: signupContext.traceId, spanId: parent.spanID }, 'CHILD_OF'),
      `${childName} has an incorrect parent`,
    );
    return child;
  };
  const signupOperation = childOf('auth.signup', signupServer);
  childOf('postgres.account.create', signupOperation);
  const session = childOf('auth.session.create', signupOperation);
  const workspace = childOf('auth.workspace.initialize', session);
  childOf('postgres.transaction', workspace);
  const requestTraces = [];
  for (const request of [...originals, ...refreshes, ...retries, ...rejected.requests]) {
    requestTraces.push(await traceForRequest(request));
  }
  const refresh = requestTraces[2];
  for (const original of requestTraces.slice(0, 2)) {
    assert.ok(
      hasReference(refresh.browser, original.context, 'FOLLOWS_FROM'),
      'refresh lacks waiter link',
    );
  }
  const linkedOriginals = new Set();
  for (const retry of requestTraces.slice(3, 5)) {
    assert.ok(
      hasReference(retry.browser, refresh.context, 'FOLLOWS_FROM'),
      'retry lacks refresh link',
    );
    const original = requestTraces
      .slice(0, 2)
      .find((item) => hasReference(retry.browser, item.context, 'FOLLOWS_FROM'));
    assert.ok(original, 'retry lacks original request link');
    linkedOriginals.add(original.context.spanId);
  }
  assert.equal(linkedOriginals.size, 2);

  const privatePathContext = requestContext(privatePath.requests[0]);
  const deadline = Date.now() + 10000;
  let batches;
  do {
    batches = await evaluate('window.traceHarness.exports()');
    const spans = batches.flatMap((batch) => batch.spans);
    if (
      spans.some((span) => span.status === 0) &&
      spans.some((span) => span.spanId === privatePathContext.spanId) &&
      spans.filter((span) => span.operation === 'auth.refresh.wait').length >= 2
    )
      break;
    await delay(200);
  } while (Date.now() < deadline);
  assert.ok(batches.every((batch) => batch.status === 202 && !batch.containsPrivateData));
  const waits = batches
    .flatMap((batch) => batch.spans)
    .filter((span) => span.operation === 'auth.refresh.wait');
  const waitTraces = [];
  for (const original of requestTraces.slice(0, 2)) {
    const wait = waits.find((span) =>
      span.links.some(
        (link) =>
          link.traceId === original.context.traceId && link.spanId === original.context.spanId,
      ),
    );
    assert.ok(wait, 'original request has no exported refresh wait span');
    assert.equal(wait.outcome, 'success');
    const waitTrace = await waitForTrace(wait.traceId, (spans) =>
      spans.some((span) => span.spanID === wait.spanId),
    );
    const waitSpan = waitTrace.spans.find((span) => span.spanID === wait.spanId);
    assert.equal(waitSpan.operationName, 'auth.refresh.wait');
    assert.equal(tag(waitSpan, 'pci.refresh.outcome'), 'success');
    assert.ok(hasReference(waitSpan, original.context, 'FOLLOWS_FROM'));
    assert.ok(hasReference(waitSpan, refresh.context, 'FOLLOWS_FROM'));
    waitTraces.push(waitTrace);
  }
  const checkWait = async (originalRequest, refreshRequest, outcome) => {
    const original = requestContext(originalRequest);
    const refreshContext = requestContext(refreshRequest);
    const deadline = Date.now() + 10000;
    let wait;
    while (!wait && Date.now() < deadline) {
      const current = await evaluate('window.traceHarness.exports()');
      wait = current
        .flatMap((batch) => batch.spans)
        .find(
          (span) =>
            span.operation === 'auth.refresh.wait' &&
            span.links.some(
              (link) => link.traceId === original.traceId && link.spanId === original.spanId,
            ),
        );
      if (!wait) await delay(200);
    }
    assert.ok(wait, 'refresh waiter was not exported');
    assert.equal(wait.outcome, outcome);
    const trace = await waitForTrace(wait.traceId, (spans) =>
      spans.some((span) => span.spanID === wait.spanId),
    );
    const span = trace.spans.find((item) => item.spanID === wait.spanId);
    assert.equal(tag(span, 'pci.refresh.outcome'), outcome);
    if (outcome === 'error') assert.equal(tag(span, 'error'), true);
    assert.ok(hasReference(span, original, 'FOLLOWS_FROM'));
    assert.ok(hasReference(span, refreshContext, 'FOLLOWS_FROM'));
    return trace;
  };
  const cancelledOriginal = cancelledOriginals.find((item) => item.cancelledWaiter);
  const remainingOriginal = cancelledOriginals.find((item) => !item.cancelledWaiter);
  assert.ok(cancelledOriginal && remainingOriginal);
  waitTraces.push(await checkWait(cancelledOriginal, cancelledRefresh[0], 'error'));
  waitTraces.push(await checkWait(remainingOriginal, cancelledRefresh[0], 'success'));
  waitTraces.push(await checkWait(timeoutOriginal, timeoutRefresh, 'error'));
  const remainingRetry = await traceForRequest(remainingRetries[0]);
  assert.ok(
    hasReference(remainingRetry.browser, requestContext(remainingOriginal), 'FOLLOWS_FROM'),
  );
  assert.ok(
    hasReference(remainingRetry.browser, requestContext(cancelledRefresh[0]), 'FOLLOWS_FROM'),
  );
  const timeoutContext = requestContext(timeoutRefresh);
  const timeoutTrace = await waitForTrace(
    timeoutContext.traceId,
    (spans) =>
      spans.some((span) => span.spanID === timeoutContext.spanId) &&
      spans.some(
        (span) =>
          tag(span, 'span.kind') === 'server' && hasReference(span, timeoutContext, 'CHILD_OF'),
      ),
  );
  const timeoutSpan = timeoutTrace.spans.find((span) => span.spanID === timeoutContext.spanId);
  assert.equal(tag(timeoutSpan, 'http.response.status_code'), 200);
  assert.equal(tag(timeoutSpan, 'error'), true);
  assert.ok(
    batches
      .flatMap((batch) => batch.spans)
      .some((span) => span.spanId === timeoutContext.spanId && span.status === 200 && span.failed),
    'response-body timeout was not exported with its HTTP status and error',
  );
  assert.ok(timeoutSpan.duration >= 14_000_000 && timeoutSpan.duration <= 22_000_000);
  const cancelled = batches.flatMap((batch) => batch.spans).find((span) => span.status === 0);
  assert.ok(cancelled, 'cancelled request span was not exported');
  assert.ok(
    batches
      .flatMap((batch) => batch.spans)
      .some((span) => span.spanId === privatePathContext.spanId),
    'dynamic-path request span was not exported by the browser',
  );
  assert.ok(cancelled.durationMs >= 0);
  const cancelledTrace = await waitForTrace(cancelled.traceId, (spans) =>
    spans.some((span) => span.spanID === cancelled.spanId),
  );
  const cancelledSpan = cancelledTrace.spans.find((span) => span.spanID === cancelled.spanId);
  assert.equal(tag(cancelledSpan, 'http.response.status_code'), 0);
  assert.equal(tag(cancelledSpan, 'error'), true);
  const privatePathTrace = await traceForRequest(privatePath.requests[0]);
  assert.equal(privatePathTrace.browser.operationName, 'GET /api/v1/*');
  assert.ok(
    privatePathTrace.trace.spans.some(
      (span) =>
        span.operationName === 'GET /api/v1/public/requests/:resultAccessToken' &&
        hasReference(span, privatePathTrace.context, 'CHILD_OF'),
    ),
    'result route server span is missing or not a browser child',
  );
  const telemetry = JSON.stringify({
    signupTrace,
    requestTraces,
    waitTraces,
    cancelledTrace,
    timeoutTrace,
    remainingRetry,
    privatePathTrace,
    batches,
  });
  for (const value of sensitive)
    assert.ok(!telemetry.includes(value), 'sensitive test value appeared in telemetry');
  console.log(
    'Browser tracing acceptance passed: signup, refresh links, independent cancellation, timeout, retry, rejected refresh and dynamic-path privacy.',
  );
} finally {
  if (tab) await command('closetab', tab);
}
