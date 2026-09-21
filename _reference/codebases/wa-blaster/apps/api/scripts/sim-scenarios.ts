/**
 * HTTP scenario runner for the QA simulator. Logs in as admin, then POSTs each scenario's turns to
 * /api/sim/inbound (resetting each phone first) and asserts the returned decision subKind/reason.
 * Deterministic only in mock-LLM mode. Requires a running API with SIMULATOR_ENABLED=true and
 * WHATSAPP_MOCK_MODE=true.
 *
 *   pnpm --filter api chatbot:scenarios
 *   SIM_API_URL=http://host:3000/api SIM_ADMIN_EMAIL=... SIM_ADMIN_PASSWORD=... pnpm --filter api chatbot:scenarios
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface Scenario {
  id: string;
  phone: string;
  turns: string[];
  expectSubKind?: string;
  expectReason?: string;
}

const API = process.env.SIM_API_URL ?? 'http://localhost:3000/api';
const EMAIL = process.env.SIM_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.SIM_ADMIN_PASSWORD ?? 'ChangeMe123!';

async function login(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { accessToken: string };
  return body.accessToken;
}

async function main(): Promise<void> {
  const raw = JSON.parse(readFileSync(join(__dirname, 'sim-scenarios.json'), 'utf-8')) as { scenarios: Scenario[] };
  const token = await login();
  const auth = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  const failures: string[] = [];
  for (const s of raw.scenarios) {
    const resetRes = await fetch(`${API}/sim/reset/${encodeURIComponent(s.phone)}`, { method: 'POST', headers: auth });
    if (!resetRes.ok) { failures.push(`${s.id}: reset failed ${resetRes.status}`); console.log(`[FAIL] ${s.id.padEnd(22)} reset failed ${resetRes.status}`); continue; }
    let last: { subKind: string; reason: string } | null = null;
    for (const text of s.turns) {
      const res = await fetch(`${API}/sim/inbound`, { method: 'POST', headers: auth, body: JSON.stringify({ phone: s.phone, text }) });
      if (!res.ok) { failures.push(`${s.id}: inbound failed ${res.status} ${await res.text()}`); last = null; break; }
      last = (await res.json()) as { subKind: string; reason: string };
    }
    if (!last) { console.log(`[FAIL] ${s.id.padEnd(22)} inbound turn failed`); continue; }
    if (s.expectSubKind && last.subKind !== s.expectSubKind) {
      failures.push(`${s.id}: expected subKind ${s.expectSubKind}, got ${last.subKind} (reason ${last.reason})`);
    }
    if (s.expectReason && last.reason !== s.expectReason) {
      failures.push(`${s.id}: expected reason ${s.expectReason}, got ${last.reason}`);
    }
    console.log(`[${failures.some((f) => f.startsWith(s.id + ':')) ? 'FAIL' : 'PASS'}] ${s.id.padEnd(22)} ${last.subKind}`);
  }

  console.log(`\n${failures.length === 0 ? '✅ SCENARIOS PASSED' : `❌ ${failures.length} FAILURE(S)`}`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
