import { test } from '@playwright/test';
import { Session, MonthState, MONTH_STATE, sameStatus, showStatus } from '../utils/session';
import { monthInput, required, CONFIG } from '../data/config';
import { RoleKey } from '../data/users';
import { addDays, ddmmyyyy, detail, today } from '../utils/format';

// Test-data setup (not a TS): moves one month forward through the workflow to
// the status a TS needs, using the Drafter / Reviewer / Approver logins typed
// on the runner page. The workflow TS each act on a month in one status and
// most of those actions cannot be undone, so months run out fast (scenarios.md
// Open point 6). The setup fills a pool on the runner page; it is never wired
// to a TS (standing rule: setups fill a pool, the person picks).
//
// Moves (SRD v1.1 REQ-010 to REQ-012):
//   Pending / Drafter Review Again → Drafter Approve → Drafter Approved; → KIV
//   Drafter Approved / Reviewer Review Again → Reviewer Approve → Reviewer Approved; → Reviewer Reject → Drafter Review Again
//   Reviewer Approved → Approver Approve (tomorrow) → fully approved; → Approver Reject → Reviewer Review Again

type Move = { to: MonthState; role: RoleKey; label: string };
const MOVES: Record<MonthState, Move[]> = {
  Pending: [{ to: 'DA', role: 'drafter', label: 'Drafter [Approve]' }, { to: 'KIV', role: 'drafter', label: 'Drafter [KIV]' }],
  DRA: [{ to: 'DA', role: 'drafter', label: 'Drafter [Approve]' }, { to: 'KIV', role: 'drafter', label: 'Drafter [KIV]' }],
  DA: [{ to: 'RA', role: 'reviewer', label: 'Reviewer [Approve]' }, { to: 'DRA', role: 'reviewer', label: 'Reviewer [Reject]' }],
  RRA: [{ to: 'RA', role: 'reviewer', label: 'Reviewer [Approve]' }, { to: 'DRA', role: 'reviewer', label: 'Reviewer [Reject]' }],
  RA: [{ to: 'Full', role: 'approver', label: 'Approver [Approve]' }, { to: 'RRA', role: 'approver', label: 'Approver [Reject]' }],
  KIV: [],
  Full: [],
};

function path(from: MonthState, to: MonthState): Move[] | null {
  const queue: { at: MonthState; moves: Move[] }[] = [{ at: from, moves: [] }];
  const seen = new Set<MonthState>([from]);
  while (queue.length) {
    const { at, moves } = queue.shift()!;
    if (at === to) return moves;
    for (const m of MOVES[at]) if (!seen.has(m.to)) { seen.add(m.to); queue.push({ at: m.to, moves: [...moves, m] }); }
  }
  return null;
}

test('12028_PREP: Move a month to a chosen workflow status', async ({ page }) => {
  const month = monthInput('E12028_MONTH', 'Month');
  const target = required('E12028_TARGET', 'Target status') as MonthState;
  if (!MONTH_STATE[target]) throw new Error(`Target status "${target}" is not one of ${Object.keys(MONTH_STATE).join(', ')}.`);
  const s = new Session(page, '12028_PREP');
  await s.as('drafter');
  let { details: d } = await s.openMonth(month);
  const now = await d.statuses();
  const from = (Object.keys(MONTH_STATE) as MonthState[]).find(k => sameStatus(MONTH_STATE[k].s, now));
  if (!from) throw new Error(`${month} shows ${showStatus(now)}, which is not a status this setup knows.`);
  const moves = path(from, target);
  if (!moves) throw new Error(`${month} is ${MONTH_STATE[from].label}; it cannot be moved to ${MONTH_STATE[target].label} (KIV and fully approved are final here).`);
  detail('Month', `${month} ${CONFIG.year}`);
  detail('Starting status', MONTH_STATE[from].label);
  for (const m of moves) {
    if (s.current !== m.role) {
      await s.as(m.role);
      ({ details: d } = await s.openMonth(month));
    }
    await test.step(`${m.label} on ${month}`, async () => {
      if (m.label.endsWith('[KIV]')) await d.kiv();
      else if (m.label.endsWith('[Reject]')) await d.reject(m.role === 'reviewer' ? 'Reviewer' : 'Approver', `Automation 12028_PREP ${new Date().toISOString().slice(0, 16)}`);
      else if (m.role === 'approver') await d.approverApprove(addDays(today(), 1));
      else await d.approve(m.role === 'drafter' ? 'Drafter' : 'Reviewer');
    });
  }
  const end = await d.statuses();
  if (!sameStatus(end, MONTH_STATE[target].s)) throw new Error(`${month} ended at ${showStatus(end)}, not ${MONTH_STATE[target].label}.`);
  await d.captureEvidence('12028_PREP-done');
  detail('Status', MONTH_STATE[target].label);
  detail('Status key', target);
  if (target === 'Full') detail('Payment date', ddmmyyyy(addDays(today(), 1)));
});
