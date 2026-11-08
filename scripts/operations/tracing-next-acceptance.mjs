import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const browse = process.env.TRACING_BROWSE_EXECUTABLE;
if (!browse) throw new Error('Set TRACING_BROWSE_EXECUTABLE to the gstack browse executable.');
const execute = promisify(execFile);
const origin = 'http://localhost:13000';
const email = `next-tracing-${randomUUID()}@example.test`;
const password = 'TraceNextPass123!';
const name = 'Tracing Next Test';

async function command(...args) {
  try {
    const { stdout } = await execute(browse, args, { timeout: 30000, maxBuffer: 1024 * 1024 });
    return stdout.trim();
  } catch {
    throw new Error(`browse ${args[0]} failed`);
  }
}

async function evaluate(expression) {
  return JSON.parse(await command('js', `JSON.stringify(${expression})`));
}

async function waitFor(condition, message) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const result = await condition();
    if (result) return result;
    await delay(250);
  }
  throw new Error(message);
}

function childOf(span, parent) {
  return span.references.some(
    (reference) => reference.refType === 'CHILD_OF' && reference.spanID === parent.spanID,
  );
}

let tab;
try {
  const opened = await command('newtab', `${origin}/auth/signup`);
  tab = /Opened tab (\d+)/u.exec(opened)?.[1];
  assert.ok(tab, 'browse did not report the new tab');
  await evaluate("(localStorage.removeItem('pci.auth.session'), true)");
  await command('goto', `${origin}/auth/signup`);
  await waitFor(
    () => evaluate("Boolean(document.querySelector('#email'))"),
    'Signup form did not load',
  );
  await evaluate(`(() => {
    const original = window.fetch;
    window.__tracingAcceptanceNavigation = true;
    window.fetch = function(input, init) {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('/api/v1/auth/signup')) {
        sessionStorage.setItem('tracing.acceptance.parent', new Headers(init?.headers).get('traceparent') || '');
      }
      return original.apply(this, arguments);
    };
    return true;
  })()`);
  await command('fill', '#email', email);
  await command('fill', '#name', name);
  await command('fill', '#password', password);
  await command('fill', '#confirmPassword', password);
  await command('click', 'button[type=submit]');
  await waitFor(
    () => evaluate("location.pathname === '/dashboard'"),
    'Signup did not reach dashboard',
  );
  assert.equal(
    await evaluate('window.__tracingAcceptanceNavigation === true'),
    true,
    'Signup did not use client-side navigation',
  );
  await waitFor(
    () => evaluate(`document.body.innerText.includes(${JSON.stringify(email)})`),
    'Dashboard did not show the registered email',
  );
  const parent = await evaluate("sessionStorage.getItem('tracing.acceptance.parent')");
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-01$/u.exec(parent ?? '');
  assert.ok(match, 'Signup did not send a sampled traceparent');
  const session = await evaluate("JSON.parse(localStorage.getItem('pci.auth.session') || 'null')");
  assert.ok(session?.accessToken && session?.refreshToken, 'Signup did not create a local session');

  const trace = await waitFor(async () => {
    try {
      const response = await globalThis.fetch(`http://127.0.0.1:16686/api/traces/${match[1]}`, {
        signal: globalThis.AbortSignal.timeout(2000),
      });
      const item = response.ok ? (await response.json()).data?.[0] : undefined;
      const names = item?.spans?.map((span) => span.operationName) ?? [];
      return [
        'auth.signup',
        'auth.session.create',
        'auth.workspace.initialize',
        'postgres.account.create',
        'postgres.transaction',
      ].every((operation) => names.includes(operation)) &&
        item.spans.some((span) => span.spanID === match[2])
        ? item
        : undefined;
    } catch {
      return undefined;
    }
  }, 'Jaeger did not receive the complete signup trace');

  const browser = trace.spans.find((span) => span.spanID === match[2]);
  const server = trace.spans.find(
    (span) => span.operationName === 'POST /api/v1/auth/signup' && childOf(span, browser),
  );
  assert.ok(server, 'Server span is not a child of the browser span');
  const findChild = (operation, parentSpan) => {
    const span = trace.spans.find(
      (item) => item.operationName === operation && childOf(item, parentSpan),
    );
    assert.ok(span, `${operation} has an incorrect parent`);
    return span;
  };
  const signup = findChild('auth.signup', server);
  findChild('postgres.account.create', signup);
  const authSession = findChild('auth.session.create', signup);
  const workspace = findChild('auth.workspace.initialize', authSession);
  findChild('postgres.transaction', workspace);
  const payload = JSON.stringify(trace);
  for (const value of [email, password, name, session.accessToken, session.refreshToken]) {
    assert.ok(!payload.includes(value), 'A test credential or personal value appeared in Jaeger');
  }
  console.log(`Next.js signup tracing acceptance passed; trace ${match[1]}.`);
} finally {
  if (tab) {
    await evaluate(
      "(localStorage.removeItem('pci.auth.session'), sessionStorage.removeItem('tracing.acceptance.parent'), true)",
    );
    await command('closetab', tab);
  }
}
