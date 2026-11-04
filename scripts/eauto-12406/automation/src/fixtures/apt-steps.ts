// APT set-up and reads a CR spec shares: the Approved STMS an APT is made from, BO > Manual APT Trigger, the APT listing
// until it settles, the "Payment Details" lines, and the guard on the QA prefix IM before its eSim rows are switched.
// They only CALL flows (@flows/apt.flow, @flows/bo-actions.flow) and log every step in the TS.
//
// Moved here 27.10.2026 from cr/EAINT-12626/03-spec/_checks.ts (26.10.2026), which EAINT-12650 had copied whole.
// The APT is triggered on AZFARAZO's ROC, so these run as an AZFARAZO user (lanes 1, 3, 4: `requireAzfarazo`).
import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import type { TsRun } from "./ts-run";
import { lanePersona } from "@config/personas";
import { EsimClient, ESIM_ENTITY, type EsimRecord } from "./esim";
import { QA_TAG } from "@data/qa-prefixes";
import { AZFARAZO_ROC } from "@pages/bo/company-accounts.page";
import { manualAptTrigger, findAptTransaction } from "@flows/bo-actions.flow";
import { readAptListing } from "@flows/apt.flow";
import type { AptAfterPayment } from "@pages/ucd/apt.page";

const words = (s: string | null | undefined) => String(s ?? "").replace(/\s+/g, " ").trim();
const pathOf = (u?: string) => { try { return new URL(String(u)).pathname; } catch { return String(u ?? ""); } };

/** Stop unless the run's UCD user is one of AZFARAZO's (lanes 1, 3, 4): the APT is triggered on AZFARAZO's ROC. */
export function requireAzfarazo() {
  expect(["ucdE2E", "ucdE2E3", "ucdE2E4"], `this sheet runs as an AZFARAZO user (lane 1, 3 or 4); the lane's user is ${lanePersona()}`).toContain(lanePersona());
}

/**
 * The APT's Approved STMS: `envVar` when set (an Approved AZFARAZO STMS bought earlier, no APT yet: no new STMS paid),
 * else `buy()` (which calls the STMS flow). Logged either way.
 */
export async function approvedStms(ts: TsRun, envVar: string, buy: () => Promise<string>): Promise<string> {
  const reuse = process.env[envVar];
  if (reuse) {
    ts.note(`APT source STMS: ${reuse} (${envVar}: an Approved AZFARAZO STMS bought earlier; no new STMS)`);
    return reuse;
  }
  const v = await buy();
  ts.note(`APT source STMS bought in this TS: ${v}`);
  return v;
}

/**
 * BO > Manual APT Trigger 5.5 + 6.0 on the vehicle's Approved STMS (bo-actions flow, inside ts.allowConfirm: BO asks
 * with browser confirms), unless BO already lists an APT for it. Stops the TS when no APT row comes (4 reads, 15 s).
 */
export async function ensureApt(ts: TsRun, vehicle: string): Promise<Record<string, string>> {
  await ts.portal("bo", `Manual APT Trigger (5.5 then 6.0) on ${vehicle}'s Approved STMS`);
  const existing = await findAptTransaction(ts.page, { vehicleNo: vehicle });
  if (existing) {
    ts.note(`BO already lists an APT for ${vehicle}: ${JSON.stringify(existing)} — not triggered again`);
    return existing;
  }
  const trig = await ts.allowConfirm(() => manualAptTrigger(ts.page, { vehicleNo: vehicle, companyRoc: AZFARAZO_ROC, expectStms: { "Tx Status": /Approved/ } }));
  let apt = trig.apt;
  for (let i = 0; i < 3 && !apt; i++) {
    await ts.page.waitForTimeout(5_000);
    apt = await findAptTransaction(ts.page, { vehicleNo: vehicle });
  }
  ts.note(`APT triggered for ${vehicle} (${trig.stages.join(" + ")}): ${JSON.stringify(apt)}; BO confirms answered: ${ts.takeDialogs() || "(none seen)"}`);
  expect(apt, `BO lists no APT for ${vehicle} after Manual APT Trigger (checked 4 times over 15 s): the UCD part cannot run`).toBeTruthy();
  return apt!;
}

/** The APT listing row read in the TS tab (signed in as the UCD user), until Payment OK + Approved (8 reads, 30 s apart) or the last read. */
export async function settledListing(ts: TsRun, vehicle: string, tx?: string): Promise<{ row: Record<string, string> | null; ok: boolean; shows: string; hl: Locator }> {
  const ok = (r: Record<string, string> | null) => {
    const vals = Object.entries(r ?? {});
    return vals.some(([k, v]) => /^payment$/i.test(k) && /^OK/i.test(v)) && vals.some(([k, v]) => /status/i.test(k) && /Approved/i.test(v));
  };
  let row: Record<string, string> | null = null;
  for (let i = 0; i < 8; i++) {
    row = await readAptListing(ts.page, vehicle, tx);
    if (ok(row)) break;
    if (i < 7) {
      await ts.offscreen("Waiting for the APT listing to settle", `read ${i + 1} of 8: ${words(JSON.stringify(row)).slice(0, 160)}; next in 30 s`);
      await ts.page.waitForTimeout(30_000);
    }
  }
  const shows = `APT listing: ${Object.entries(row ?? {}).map(([k, v]) => `${k}: ${v}`).join(" | ") || "no row"}`;
  return { row, ok: ok(row), shows, hl: ts.page.locator("table tr", { hasText: vehicle }).last() };
}

/** An address under the instance root ("view/ucd/apt/transaction/jpj-sub.do?id=…"), for a Firefox 36 `goto` / page.goto. */
export function underRoot(ts: TsRun, url: string): string {
  const marker = `/${ts.inst}/`;
  const i = url.indexOf(marker);
  return i === -1 ? url.replace(/^https?:\/\/[^/]+\//, "") : url.slice(i + marker.length);
}

/** The screen after an APT payment in Chrome (`AptPage.afterPayment`), in the same words as `aptLandingWords` (Firefox 36). */
export const afterWords = (a: AptAfterPayment, via?: string) =>
  `after the payment confirm (nothing clicked, no F5): ${via === "moved" ? "the page LEFT Step 5" : via === "sent" ? "'Payment request sent' came up on Step 5" : `pay() said ${via ?? "?"}`}; ` +
  `"Payment request sent" ${a.sentDialog ? "SHOWN" : "not shown"}; visible dialogs: ${a.dialogs.join(" || ") || "none"}; page ${pathOf(a.url)}; ` +
  `step strip "${a.activeStep}"; heading "${a.heading}"; JPJ Transfer Status "${a.status}"`;

/**
 * Successful payments in Transaction Details "Payment Details:" lines, counted by RHB REFERENCE: the page prints every
 * RHB payment twice, once as "RHB (<ref>-<vehicle>)" and once as "RHB (<ref>)" (A60347839, EAINT-12626 probe p01,
 * 26.10.2026), so one payment = one reference. A retry after a refusal re-sends the same reference (knowledge/_core/apt.md).
 */
export function successfulPayments(lines: string[]): { refs: string[]; okLines: string[] } {
  const okLines = lines.filter((l) => /\)\s*-\s*OK\b/.test(l));
  const refs = [...new Set(okLines.map((l) => (/\(([^)]+)\)/.exec(l)?.[1] ?? l).replace(/-[A-Z]{1,3}\d+$/, "")))];
  return { refs, okLines };
}

/**
 * The QA prefix IM (@data/qa-prefixes: the submission-fail family) before its rows are switched: eSim matches "starts
 * with" both ways, so every row whose prefix starts with IM, or that IM starts with, in the entities touched must carry
 * QA_TAG; otherwise the TS stops before anything is written. Also returns IM's current values and ON's
 * stms-submission-resp row (read only). APT reads its JPJ transfer answer from apt-submission-resp (EAINT-12626 TS9).
 */
export async function imRows(ts: TsRun): Promise<{ submission: string; rhb: string; onSubmission: string | null; aptSubmission: string }> {
  const IM = "IM", ON = "ON";
  const e = new EsimClient();
  await e.connect();
  try {
    const ours = (r: EsimRecord | null) => String(r?.remark ?? "").startsWith(QA_TAG);
    for (const entity of [ESIM_ENTITY.stmsEnquiry, ESIM_ENTITY.rhbTransfer, ESIM_ENTITY.stmsSubmission]) {
      const clash = (await e.list(entity)).filter((r) => { const k = String(r.vnStartWith ?? "").toUpperCase(); return !!k && (k.startsWith(IM) || IM.startsWith(k)); });
      const foreign = clash.filter((r) => !ours(r));
      expect(foreign.map((r) => `#${r.id} "${r.vnStartWith}"`), `eSim ${entity}: rows matching IM that are not QA-owned — nothing written`).toEqual([]);
      expect(clash.some((r) => String(r.vnStartWith).toUpperCase() === IM), `eSim ${entity}: QA-owned IM row missing (run cr/EAINT-12253/03-spec/probes-2210/esim-im-seed.ts)`).toBe(true);
    }
    const sub = await e.findByPrefix(ESIM_ENTITY.stmsSubmission, IM);
    const rhb = await e.findByPrefix(ESIM_ENTITY.rhbTransfer, IM);
    const on = (await e.list(ESIM_ENTITY.stmsSubmission)).find((r) => String(r.vnStartWith).toUpperCase() === ON) ?? null;
    const apt = (await e.list(ESIM_ENTITY.aptSubmission).catch(() => [] as EsimRecord[])).filter((r) => { const k = String(r.vnStartWith ?? "").toUpperCase(); return !!k && (k.startsWith(IM) || IM.startsWith(k)); });
    const out = {
      submission: String(sub?.responseCode ?? "(no row)"),
      rhb: String(rhb?.responseCode ?? "(no row)"),
      onSubmission: on ? String(on.responseCode ?? "(blank)") : null,
      aptSubmission: apt.length ? apt.map((r) => `#${r.id} "${r.vnStartWith}" responseCode ${r.responseCode}`).join("; ") : "no row matching IM",
    };
    ts.note(`eSim IM (read only, all QA-owned): stms-submission-resp ${out.submission}; rhb-transfer-resp ${out.rhb}; ON's stms-submission-resp ${out.onSubmission ?? "(no row: eSim's default answer)"}; apt-submission-resp: ${out.aptSubmission}`);
    return out;
  } finally {
    await e.close();
  }
}
