/**
 * Switch one of OUR eSim prefixes' RHB transfer answer between OK and IF.
 *
 * Moved here from tests/_explore/eaint-12403-lib.ts (15.10.2026) because
 * EAINT-12022 needed the same switch: one ticket's specs no longer import
 * another ticket's lib. Refuses any record not tagged QA_TAG — other people's
 * prefixes are never written (see README "Prefixes that must not be written").
 */
import { EsimClient, ESIM_ENTITY } from "@fixtures/esim";
import { QA_PREFIXES, QA_TAG } from "@data/qa-prefixes";
import type { TsRun } from "./ts-run";
import { withMachineLock } from "./lane-guard";

export async function setRhb(prefix: string, code: "OK" | "IF") {
  const esim = new EsimClient();
  await esim.connect();
  try {
    const rec = await esim.findByPrefix(ESIM_ENTITY.rhbTransfer, prefix);
    if (!rec || !String((rec as any).remark ?? "").startsWith(QA_TAG)) throw new Error(`${prefix} rhb-transfer-resp missing or not ours — refusing`);
    await esim.update(ESIM_ENTITY.rhbTransfer, { ...(rec as any), responseCode: code });
    console.log(`  eSim ${prefix} RHB -> ${code}`);
  } finally {
    await esim.close();
  }
}

/**
 * Run `fn` with a switchable prefix at OK, and always put it back to IF. Holds the machine-wide lock
 * `esim-<prefix>` meanwhile, so a second lane switching the same prefix waits instead of flipping it
 * back to IF under the first one's payment (lane-guard.ts, 21.10.2026).
 */
export async function withRhbOk<T>(prefix: string | undefined, fn: () => Promise<T>): Promise<T> {
  if (!prefix) return fn();
  return withMachineLock(`esim-${prefix}`, async () => {
    await setRhb(prefix, "OK");
    try { return await fn(); } finally {
      for (let i = 0; i < 3; i++) { try { await setRhb(prefix, "IF"); break; } catch (e) { if (i === 2) throw e; await new Promise((r) => setTimeout(r, 3000)); } }
    }
  });
}

/**
 * Make sure OUR `estm-enquiry-resp` row for `prefix` exists (created with QA_TAG when missing; a row
 * someone else made is refused), then set its response code. Added 2026-10-20 for EAINT-12253's
 * VEL000069E insurance route. Use a TWO-letter prefix: eSim answered an OUPV vehicle from its first two
 * letters and ignored an "OUPV" row (20.10.2026), so the route switches the QA-owned "OU" row.
 * Amounts copy a staging GLB000000I AB/MKR row (JPJ 2361007 RM100, FIS 2354071 RM50).
 */
export async function setEstmCode(prefix: string, code: string): Promise<void> {
  const esim = new EsimClient();
  await esim.connect();
  try {
    const rec = await esim.findByPrefix(ESIM_ENTITY.estmEnquiry, prefix);
    if (rec && !String((rec as any).remark ?? "").startsWith(QA_TAG)) throw new Error(`${prefix} estm-enquiry-resp exists and is not ours — refusing`);
    if (!rec) {
      await esim.create(ESIM_ENTITY.estmEnquiry, {
        vnStartWith: prefix, jsjStatus: "0", sekatStatus: "0", jpjEnqStatus: "0", responseCode: code,
        usageCode: "AB", bodyType: "MKR", jpjRevenueCode: "2361007", paymentAmount: 100, fisRevenueCode: "2354071", fisAmount: 50,
        declarationArea: "SEMENANJUNG", delayMiliSeconds: 0,
        remark: `${QA_TAG} · eSTM switchable GLB000000I / VEL000069E (EAINT-12253 insurance divert) · reusable`,
      });
      console.log(`  eSim ${prefix} estm-enquiry-resp created ${code}`);
      return;
    }
    await esim.update(ESIM_ENTITY.estmEnquiry, { ...(rec as any), responseCode: code });
    console.log(`  eSim ${prefix} eSTM -> ${code}`);
  } finally {
    await esim.close();
  }
}

// ------------------------------------------------------------------ the same switch, logged in a TS (moved 27.10.2026)
// From cr/EAINT-12253/03-spec/_helpers-2-3.ts (21.10.2026), which EAINT-12626 and EAINT-12650 had copied.

/** Our prefix's rhb-transfer-resp answer as it is now: the code, "(blank)", or "(no row)". */
export async function readRhb(prefix: string): Promise<string> {
  const c = new EsimClient();
  await c.connect();
  try {
    const r = await c.findByPrefix(ESIM_ENTITY.rhbTransfer, prefix);
    return r ? String(r.responseCode ?? "(blank)") : "(no row)";
  } finally {
    await c.close();
  }
}

/**
 * Our prefix's RHB answer set to `code` around `fn`, under the machine-wide lock `esim-<prefix>` (the same lock
 * `withRhbOk` takes): no other lane can flip that prefix while `fn` runs, and it is put back to its resting value
 * afterwards (@data/qa-prefixes `rhb`, else the value read before), pass or fail. Every value is logged in the TS:
 * before, set, restored, read back (Azfar 21.10.2026). `card`: also show the change as a card — ONLY when the page may
 * be replaced (before a Firefox 36 run or before signing in), never around a click on a live page. Not re-entrant:
 * never nest two for the same prefix. Only QA-tagged rows are written (setRhb refuses others).
 */
export async function withRhbLocked<T>(ts: TsRun, prefix: string, code: "OK" | "IF", why: string, fn: () => Promise<T>, o: { card?: boolean } = {}): Promise<T> {
  return withMachineLock(`esim-${prefix}`, async () => {
    const before = await readRhb(prefix);
    const rest = QA_PREFIXES.find((q) => q.prefix === prefix)?.rhb ?? (before === "OK" || before === "IF" ? before : "IF");
    ts.note(`eSim rhb-transfer-resp ${prefix}: responseCode ${before} → ${code} for ${why} (lock esim-${prefix} held; back to ${rest} after)`);
    if (o.card) await ts.offscreen(`eSim: ${prefix} rhb-transfer-resp`, `responseCode ${before} → ${code} for ${why}; back to ${rest} after`);
    await setRhb(prefix, code);
    try {
      return await fn();
    } finally {
      for (let i = 0; i < 3; i++) {
        try { await setRhb(prefix, rest as "OK" | "IF"); break; } catch (e) { if (i === 2) ts.note(`eSim rhb-transfer-resp ${prefix} NOT put back to ${rest} — fix by hand: ${String(e).split(/\r?\n/)[0]}`); else await new Promise((r) => setTimeout(r, 3000)); }
      }
      const after = await readRhb(prefix).catch((e) => `unreadable (${String(e).split(/\r?\n/)[0]})`);
      ts.note(`eSim rhb-transfer-resp ${prefix}: responseCode → ${rest} (restored); read back: ${after}`);
    }
  });
}

/** `withRhbLocked` as a flow's `aroundPayment` (wraps only the paying click; no card, the page is live). */
export const rhbAround = (ts: TsRun, prefix: string, code: "OK" | "IF", why: string) =>
  <T,>(run: () => Promise<T>): Promise<T> => withRhbLocked(ts, prefix, code, why, run);

/** OK around `fn` with a card (for a whole Firefox 36 run, whose Chrome tab only shows cards meanwhile). */
export async function withRhbOkLogged<T>(ts: TsRun, prefix: string, why: string, fn: () => Promise<T>): Promise<T> {
  return withRhbLocked(ts, prefix, "OK", why, fn, { card: true });
}

// ------------------------------------------------------------------ eMOVE: the RHB answer by Company ID (30.10.2026)
// eSim decides an eMOVE payment by the dealer's Company ID, not the vehicle (Dev, EAINT-12019 Teams T55). No row = the
// simulator default OK. Lanes 1, 3 and 4 share AZFARAZO (1080458), so the lock is per company, not per lane. Proven on
// /uat3/ 30.10.2026 (EAINT-12019 smoke step 6: IF → Failed + Retry, then OK). Our row carries the remark below; a row
// for the company that someone else made is refused.
const EMOVE_RHB_REMARK = (companyId: string) => `Azfar - QA automation eMOVE company ID ${companyId}`;

export async function setEmoveRhb(companyId: string, code: string | null): Promise<void> {
  const esim = new EsimClient();
  await esim.connect();
  try {
    const rec = await esim.findByPrefix(ESIM_ENTITY.rhbTransfer, companyId);
    if (rec && !String((rec as any).remark ?? "").startsWith("Azfar - QA automation")) throw new Error(`eSim rhb-transfer-resp ${companyId} is not ours — refusing`);
    if (code === null) {
      if (rec) await esim.removeSeeded(ESIM_ENTITY.rhbTransfer, rec);
      console.log(`  eSim eMOVE ${companyId} RHB row removed (default OK)`);
      return;
    }
    await esim.ensurePrefix(ESIM_ENTITY.rhbTransfer, companyId, {
      responseCode: code, description: code === "OK" ? "OK" : code, delayMiliSeconds: 0, remark: EMOVE_RHB_REMARK(companyId),
    } as any);
    console.log(`  eSim eMOVE ${companyId} RHB -> ${code}`);
  } finally {
    await esim.close();
  }
}

/** Run `fn` with the company's eMOVE RHB answer set to `code` (e.g. "IF"), then remove the row again. VPN. */
export async function withEmoveRhb<T>(companyId: string, code: string, fn: () => Promise<T>): Promise<T> {
  return withMachineLock(`esim-emove-${companyId}`, async () => {
    await setEmoveRhb(companyId, code);
    try { return await fn(); } finally {
      for (let i = 0; i < 3; i++) { try { await setEmoveRhb(companyId, null); break; } catch (e) { if (i === 2) throw e; await new Promise((r) => setTimeout(r, 3000)); } }
    }
  });
}
