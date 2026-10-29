import fs from 'fs';
import path from 'path';
import { test, type Page } from '@playwright/test';
import { CiboListingPage, CiboLoginPage, type ListingRow } from '../pages/cibo/CiboPages';
import { CIBO_REFS } from '../data/cibo';
import { rememberInsuranceDate, parseCiboDate, lastWeek } from './insuranceDates';

// ── Finds CIBO transaction refs the dashboard left blank ────
// Faizuddin, 2026-10-19: the "BR…" boxes on /eauto/12107 are "any values that
// the automation should decide by itself". A typed ref always wins; a blank
// one is filled here by reading the Transaction Management listing the way a
// person would — click Search, choose 100 items per page, read the rows, page
// with » / « — and taking the first row that fits. Nothing is typed into the
// search box and no data is changed.
//
// Row shapes seen live 2026-10-16 (_reference/html/cibo/transaction-management.html):
//   "Transaction Ref. No." = "BR60006232 Secarang" (ref + platform badge)
//   "Payment"              = "RM884.48Paid 07-10-2026 10:20" (badge Paid / Pending / Failed, or none)
//   "Payment Mode"         = "-", "Bold Pay", "Fiuu", "Fiuu | eWallet – GrabPay – Full Amount – Single Payment", …
// Listing is newest first, so pre-push / pre-Fiuu rows are read from the last pages.

export type RefKind = keyof typeof CIBO_REFS;

/** The refs as typed on the dashboard, before any were filled in here. */
const TYPED: Record<string, string> = { ...CIBO_REFS };
export const isTyped = (k: RefKind) => !!TYPED[k]?.trim();

interface Seen { ref: string; platform: string; payment: string; mode: string; created: string; status: string; insuranceDate: string }
type End = 'newest' | 'oldest' | 'secarang-oldest';

// The badge text sits right after the amount with no space ("RM884.48Paid
// 07-10-2026 10:20", live 2026-10-19), so no leading word boundary.
const paid = (r: Seen) => /Paid\b/.test(r.payment);
// Payment Report only lists transactions that got insurance: a 2022 RMS row
// that never did was missing there (live 2026-10-19). Refs the TS also reads
// on Payment Report must have it.
const insured = (r: Seen) => r.status.toLowerCase().startsWith('insurance created');
const fiuu = (r: Seen, re: RegExp) => /^Fiuu\b/i.test(r.mode) && re.test(r.mode);
const boldPay = (r: Seen, re: RegExp) => /^Bold ?Pay\b/i.test(r.mode) && re.test(r.mode);

/** 12107 + 12327 go to staging with release S34.X, 20 Oct 2026; a row created
 *  earlier is "existing" for 12327_TS18. Dates read "dd-mm-yyyy hh:mm". */
const PUSH_DATE = '2026-10-20';
const beforePush = (r: Seen) => {
  const m = /^(\d{2})-(\d{2})-(\d{4})/.exec(r.created);
  return !!m && `${m[3]}-${m[2]}-${m[1]}` < PUSH_DATE;
};

/** What each blank ref should be, and which end of the listing to read. */
const RULES: Record<RefKind, { label: string; from: End | 'both' | 'payment-management'; fits: (r: Seen) => boolean }> = {
  // Transaction Listing shows a Fiuu FPX row as "Fiuu" like a Fiuu card row,
  // so this one is picked on Payment Management (findFiuuFpx below).
  fiuuFpx:      { label: 'Fiuu FPX',                 from: 'payment-management', fits: () => false },
  grabPay:      { label: 'Fiuu GrabPay Full Amount', from: 'newest', fits: r => paid(r) && fiuu(r, /GrabPay/i) && !/BNPL|PayLater/i.test(r.mode) },
  shopeePay:    { label: 'Fiuu ShopeePay',           from: 'newest', fits: r => fiuu(r, /ShopeePay/i) },
  sPayLater:    { label: 'Fiuu SPayLater',           from: 'newest', fits: r => fiuu(r, /ShopeePay/i) }, // same value as Full Amount (dev, 2026-10-19)
  grabPayLater: { label: 'Fiuu PayLater by Grab',    from: 'newest', fits: r => fiuu(r, /PayLater by Grab|GrabPay.*BNPL/i) },
  boldPayTng:   { label: 'BoldPay TouchNGo',         from: 'both',   fits: r => boldPay(r, /TouchNGo|TNG/i) },
  boldPayCard:  { label: 'BoldPay Credit/Debit Card', from: 'both',  fits: r => boldPay(r, /Card|MBBMGATE/i) },
  noPayment:    { label: 'no payment made',          from: 'newest', fits: r => r.mode === '-' && !/(Paid|Pending|Failed)\b/.test(r.payment) },
  existing:     { label: 'existing, created before the push', from: 'newest', fits: r => paid(r) && insured(r) && /^Secarang/i.test(r.platform) && /^(Fiuu \| eWallet|Bold ?Pay)/i.test(r.mode) && beforePush(r) }, // e-wallet / BoldPay: Fiuu card and FPX stay bare "Fiuu"
  eautoRhb:     { label: 'eAuto (RHB)',              from: 'both',   fits: r => paid(r) && insured(r) && /eAuto/i.test(r.platform) },
  secarangRms:  { label: 'Secarang before the Fiuu cutoff (RMS)', from: 'secarang-oldest', fits: r => paid(r) && insured(r) && /^Secarang$/i.test(r.platform) && !/Fiuu|Bold ?Pay/i.test(r.mode) },
};

/** Pages read from each end before giving up (100 rows a page). */
const PAGES_PER_END = 5;

const detail = (label: string, value: string) => console.log('DETAIL:' + JSON.stringify({ label, value }));

// Same-day cache of what the finder chose (or failed to find). The dashboard
// runs each TS as its own process, so without it every CIBO TS would read the
// listing again. Cleared by the date: tomorrow's first run reads afresh.
const CACHE_FILE = path.join(__dirname, '..', '.cache', 'cibo-refs.json');
type CacheEntry = { ref: string; info: string; date?: string } | null;
interface RefCache { day: string; refs: Partial<Record<string, CacheEntry>> }
const today = () => new Date().toLocaleDateString('en-CA');
function loadCache(): RefCache {
  try {
    const c = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as RefCache;
    if (c.day === today()) return c;
  } catch { /* no cache yet */ }
  return { day: today(), refs: {} };
}
function saveCache(c: RefCache): void {
  try { fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true }); fs.writeFileSync(CACHE_FILE, JSON.stringify(c, null, 2)); } catch { /* best effort */ }
}
/** Kinds this process filled in, so a later TS doesn't call them "typed". */
const foundHere = new Set<string>();

function toSeen(row: ListingRow): Seen {
  const [ref = '', ...rest] = (row['Transaction Ref. No.'] ?? '').split(' ');
  return { ref, platform: rest.join(' '), payment: row['Payment'] ?? '', mode: row['Payment Mode'] ?? '', created: row['Transaction Created Date'] ?? '', status: row['Transaction Status'] ?? '', insuranceDate: row['Insurance Created Date'] ?? '' };
}

/**
 * Fills every blank ref in `kinds` (CIBO_REFS is updated in place, so the
 * tests read it as if it had been typed). Opens Transaction Management,
 * reads it, then returns to `backTo` when given. A kind with no fitting row
 * stays blank and is logged — the TS then reports it as not found.
 */
export async function findBlankRefs(page: Page, login: CiboLoginPage, kinds: RefKind[], backTo?: string, recentOnly = false): Promise<void> {
  // recentOnly: the TS reads Payment Report, which is searched on the 7 days
  // up to today (Faizuddin, 2026-10-19) — so only a transaction insured in
  // that week can be checked there. Cached under its own key.
  const key = (k: RefKind) => (recentOnly ? `${k}@week` : k);
  const week = lastWeek();
  const recent = (r: Seen) => { const d = parseCiboDate(r.insuranceDate); return !!d && d >= week.from; };
  const cache = loadCache();
  // A ref filled in by an earlier TS in this run may not suit this one
  // (recent vs any), so only typed refs are kept.
  for (const k of kinds) if (!isTyped(k)) CIBO_REFS[k] = '';
  for (const k of new Set(kinds)) {
    if (CIBO_REFS[k].trim()) { detail(`${RULES[k].label} ref`, `${CIBO_REFS[k]} (typed on the dashboard)`); continue; }
    const hit = cache.refs[key(k)];
    if (hit === undefined) continue;
    foundHere.add(key(k));
    if (hit) { CIBO_REFS[k] = hit.ref; if (hit.date !== undefined) rememberInsuranceDate(hit.ref, hit.date); detail(`${RULES[k].label} ref`, `${hit.ref} (found on CIBO earlier today: ${hit.info})`); }
    else detail(`${RULES[k].label} ref`, 'none found on CIBO earlier today');
  }
  const todo = [...new Set(kinds)].filter(k => !CIBO_REFS[k].trim() && !foundHere.has(key(k)));
  if (!todo.length) { if (backTo) await test.step(`Open the ${backTo} page`, async () => { await login.openMenu(backTo); }); return; }

  await test.step(`Find transactions on CIBO for the blank refs: ${todo.map(k => RULES[k].label).join(', ')}`, async () => {
    // Fiuu FPX: a paid Secarang row on Payment Management with Payment Channel
    // "Online Banking …" and an SFX Payment Ref ID (12107_TS08's kind of row;
    // "Secarang-MK" is Makrokiosk / BoldPay, so platform must be "Secarang").
    if (todo.includes('fiuuFpx')) {
      await login.openMenu('Payment Management');
      const pm = new CiboListingPage(page);
      await pm.quietly(async () => {
        await pm.clickSearch();
        await pm.choosePageSize(100).catch(() => {});
        for (let i = 0; i < PAGES_PER_END; i++) {
          const hit = (await pm.rows()).map(r => {
            const [ref = '', ...p] = (r['Transaction Ref. No.'] ?? '').split(' ');
            return { ref, platform: p.join(' '), channel: r['Payment Channel'] ?? '', payRef: r['Payment Ref ID'] ?? '', payment: r['Payment'] ?? '' };
          }).find(r => {
            if (!r.ref || !/^Secarang$/i.test(r.platform)) return false;
            if (!/^Online Banking/i.test(r.channel) || !/SFX/.test(r.payRef) || !/Paid\b/.test(r.payment)) return false;
            const d = parseCiboDate((/\d{2}-\d{2}-\d{4}[^\d]*\d{1,2}:\d{2}/.exec(r.payment) ?? [''])[0]);
            return !recentOnly || (!!d && d >= week.from);
          });
          if (hit) {
            const date = (/\d{2}-\d{2}-\d{4}[^\d]*\d{1,2}:\d{2}/.exec(hit.payment) ?? [''])[0];
            const info = `${hit.channel} · ${hit.payRef} · ${hit.payment}`;
            CIBO_REFS.fiuuFpx = hit.ref; cache.refs[key('fiuuFpx')] = { ref: hit.ref, info, date };
            detail(`${RULES.fiuuFpx.label} ref`, `${hit.ref} (found on CIBO Payment Management: ${info})`);
            break;
          }
          if (!(await pm.nextPage())) break;
        }
      });
    }

    await login.openMenu('Transaction Management');
    const listing = new CiboListingPage(page);
    const taken = new Set<string>(Object.values(CIBO_REFS).filter(Boolean));
    const pick = (rows: ListingRow[], end: End) => {
      for (const k of todo) {
        if (CIBO_REFS[k] || (RULES[k].from !== 'both' && RULES[k].from !== end)) continue;
        const hit = rows.map(toSeen).find(r => r.ref && !taken.has(r.ref) && RULES[k].fits(r) && (!recentOnly || recent(r)));
        if (hit) {
          const info = `${hit.mode} · ${hit.payment}`;
          CIBO_REFS[k] = hit.ref; taken.add(hit.ref); cache.refs[key(k)] = { ref: hit.ref, info, date: hit.insuranceDate };
          rememberInsuranceDate(hit.ref, hit.insuranceDate);
          detail(`${RULES[k].label} ref`, `${hit.ref} (found on CIBO: ${info})`);
        }
      }
    };
    // Recent rows sit at the newest end only.
    const open = (end: End) => (!recentOnly || end === 'newest') && todo.some(k => !CIBO_REFS[k] && (RULES[k].from === 'both' || RULES[k].from === end));

    await listing.quietly(async () => {
      await listing.clickSearch();
      await listing.choosePageSize(100);
      for (let i = 0; i < PAGES_PER_END && open('newest'); i++) {
        pick(await listing.rows(), 'newest');
        if (open('newest') && !(await listing.nextPage())) break;
      }
      if (open('oldest') && (await listing.lastPage())) {
        for (let i = 0; i < PAGES_PER_END && open('oldest'); i++) {
          // Oldest rows sit at the bottom of the last page.
          pick((await listing.rows()).reverse(), 'oldest');
          if (open('oldest') && !(await listing.previousPage())) break;
        }
      }
      // The oldest rows overall are eAuto (2022, live 2026-10-19); Secarang's
      // own oldest rows (RMS, before the Fiuu cutoff) need Platform = Secarang.
      if (open('secarang-oldest')) {
        await listing.choosePlatform('Secarang');
        await listing.choosePageSize(100);
        if (await listing.lastPage()) {
          for (let i = 0; i < PAGES_PER_END && open('secarang-oldest'); i++) {
            pick((await listing.rows()).reverse(), 'secarang-oldest');
            if (open('secarang-oldest') && !(await listing.previousPage())) break;
          }
        }
        // Leave the listing unfiltered: the TS searches refs from any platform.
        await listing.clearAll();
        await listing.clickSearch();
      }
    });
    for (const k of todo) { foundHere.add(key(k)); if (!CIBO_REFS[k]) cache.refs[key(k)] = null; }
    saveCache(cache);
    for (const k of todo) if (!CIBO_REFS[k]) detail(`${RULES[k].label} ref`, recentOnly ? `none insured in the last 7 days among the ${PAGES_PER_END * 100} newest transactions` : `none found in the ${PAGES_PER_END * 100} newest / oldest transactions`);
    await listing.captureEvidence('cibo-ref-finder');
  });
  if (backTo && backTo !== 'Transaction Management') {
    await test.step(`Open the ${backTo} page`, async () => { await login.openMenu(backTo); });
  }
}
