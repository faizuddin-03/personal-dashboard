/**
 * BackOffice actions flow — what a CR does in BO once a transaction exists.
 *
 * Small composable functions, each taking a page ALREADY signed in as `bo`
 * (sign in with `new LoginPage(page).as("bo")`, in its own context if a UCD
 * session must stay open — both portals share one login cookie).
 *
 *   const row = await findStmsTransaction(bo, { vehicleNo: "OQ000002" });
 *
 *   // changes a record: says what it expects to find, refuses if it does not
 *   await resetPayment(bo, {
 *     kind: "stms", vehicleNo: "OQ000002", txNo: "S694494082",
 *     expect: { Payment: "Failed", "Tx Status": "Failed" },
 *   });
 *
 *   const report = await readResetReport(bo, { vehicleNo: "OQ000002" });
 *   report.lists("S694494082");   // true once it is reset
 *
 *   await manualAptTrigger(bo, {
 *     vehicleNo: "OQ000002", companyRoc: "JM0570913-X",
 *     expectStms: { "Tx Status": "Approved" },
 *   });
 *
 * ── The safety rule ─────────────────────────────────────────────────────────
 * Anything that CHANGES a record (`resetPayment`, `manualAptTrigger`) takes the
 * explicit vehicle and transaction it means, plus an `expect` naming the row
 * state it believes it is acting on. If the row is missing, ambiguous or in any
 * other state, it throws `BoRefusedError` and presses nothing. That is what stops
 * a run resetting someone else's transaction, or one Dev's script already reset.
 * Deciding WHICH transactions are ours is the caller's job (12403 kept a "Dev
 * list"); this flow will not act without being told.
 *
 * Status: UNVERIFIED — see src/flows/README.md.
 */

import type { Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { BoTransactionsPage, clean, type BoListingKind, type BoRow } from "@pages/bo/bo-transactions.page";

export type { BoListingKind, BoRow };

/** Column -> wanted cell. A string must match exactly (after whitespace cleaning); a RegExp is tested. */
export type RowExpectation = Record<string, string | RegExp>;

/** Thrown, with nothing pressed, when a row is not what the caller said it was. */
export class BoRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoRefusedError";
  }
}

function mismatches(row: BoRow, expect: RowExpectation): string[] {
  return Object.entries(expect).flatMap(([col, want]) => {
    const got = row[col];
    const ok = got !== undefined && (typeof want === "string" ? got === want : want.test(got));
    return ok ? [] : [`${col}: wanted ${want instanceof RegExp ? want : JSON.stringify(want)}, found ${JSON.stringify(got)}`];
  });
}

/** Throw unless the row exists and matches. An EMPTY expectation is refused: it would prove nothing. */
function requireState(row: BoRow | null, expect: RowExpectation, what: string): BoRow {
  if (Object.keys(expect).length === 0) throw new BoRefusedError(`${what}: no expectation given — say what state the row must be in.`);
  if (!row) throw new BoRefusedError(`${what}: no row found.`);
  const bad = mismatches(row, expect);
  if (bad.length) throw new BoRefusedError(`${what}: row is not in the expected state (${bad.join("; ")}). Nothing was pressed.`);
  return row;
}

// ------------------------------------------------------------------- finding

export interface FindScenario {
  vehicleNo: string;
  /** Narrow to one transaction when a vehicle has several. */
  txNo?: string;
}

async function find(bo: Page, kind: BoListingKind, s: FindScenario): Promise<BoRow | null> {
  const p = new BoTransactionsPage(bo);
  if (!(await p.searchListing(kind, s.vehicleNo))) return null;
  return p.readRow(s.vehicleNo, s.txNo);
}

/** BO STMS Transaction listing row (STMS, UCD to UCD and eSTM rows share it), or null. */
export const findStmsTransaction = (bo: Page, s: FindScenario) => find(bo, "stms", s);

/** BO APT Transaction listing row, or null. */
export const findAptTransaction = (bo: Page, s: FindScenario) => find(bo, "apt", s);

// --------------------------------------------------------------------- reset

export interface ResetScenario extends FindScenario {
  kind: BoListingKind;
  txNo: string;
  /** Required. The row state you believe you are resetting, e.g. `{ Payment: "Failed", "Tx Status": "Failed" }`. */
  expect: RowExpectation;
}

export interface ResetResult {
  before: BoRow;
  after: BoRow | null;
  /** Dialog texts the screens showed, for the report. */
  messages: string[];
  resetLinkGone: boolean;
  /** Payment "-", Tx Status "Pending", and no Reset link left — the outcome 12403 checked. */
  ok: boolean;
}

/** BO [Reset] on ONE failed transaction, then re-read it. Refuses unless the row matches `expect`. */
export async function resetPayment(bo: Page, s: ResetScenario): Promise<ResetResult> {
  const p = new BoTransactionsPage(bo);
  const found = await p.searchListing(s.kind, s.vehicleNo);
  const before = requireState(found ? await p.readRow(s.vehicleNo, s.txNo) : null, s.expect, `Reset ${s.txNo} (${s.vehicleNo})`);
  if (!(await p.resetLink(s.txNo).count())) {
    throw new BoRefusedError(`Reset ${s.txNo}: the row matches but offers no Reset link. Nothing was pressed.`);
  }

  const messages = await p.pressReset(s.txNo);

  await p.searchListing(s.kind, s.vehicleNo);
  const after = await p.readRow(s.vehicleNo, s.txNo);
  const resetLinkGone = (await p.resetLink(s.txNo).count()) === 0;
  const ok = after?.["Payment"] === "-" && after?.["Tx Status"] === "Pending" && resetLinkGone;
  return { before, after, messages, resetLinkGone, ok };
}

// ------------------------------------------------------------- reset report

export interface ResetReport {
  vehicleNo: string;
  view: Page;
  text: string;
  /** Does the report body list this transaction no.? */
  lists: (txNo: string) => boolean;
}

/** BO Reset Payment Report for a vehicle no. Read-only. */
export async function readResetReport(bo: Page, s: { vehicleNo: string }): Promise<ResetReport> {
  const { view, text } = await new BoTransactionsPage(bo).generateResetReport(s.vehicleNo);
  return { vehicleNo: s.vehicleNo, view, text, lists: (tx) => text.includes(tx) };
}

// ---------------------------------------------------------- manual APT trigger

export interface TriggerScenario {
  vehicleNo: string;
  /** The vehicle's company ROC. Default `JM0570913-X` (AZFARAZO, the ucdE2E dealer). */
  companyRoc?: string;
  /** Required. The state the source STMS row must be in, e.g. `{ "Tx Status": "Approved" }`. */
  expectStms: RowExpectation;
  /** Default both, in order: "5.5" (notice) then "6.0" (permanent). */
  stages?: ("5.5" | "6.0")[];
  /** APT expiry. Default: six months from today (what 12403 used). */
  expiry?: Date;
  /** Default false: refuse when the vehicle already has an APT, so a second one is never created. */
  allowExistingApt?: boolean;
}

export interface TriggerResult {
  stms: BoRow;
  stages: ("5.5" | "6.0")[];
  /**
   * The BO APT row after triggering, or null if it had not appeared. The triggers
   * give no success message any probe has read, so THIS is the evidence — an APT
   * row appearing. It can lag; re-check with `findAptTransaction`.
   */
  apt: BoRow | null;
}

/** BO Manual APT Trigger (5.5 then 6.0) for an Approved STMS. Refuses unless the STMS row matches and no APT exists. */
export async function manualAptTrigger(bo: Page, s: TriggerScenario): Promise<TriggerResult> {
  const p = new BoTransactionsPage(bo);
  const stms = requireState(await findStmsTransaction(bo, { vehicleNo: s.vehicleNo }), s.expectStms, `Trigger APT for ${s.vehicleNo} (source STMS)`);
  if (!s.allowExistingApt && (await findAptTransaction(bo, { vehicleNo: s.vehicleNo }))) {
    throw new BoRefusedError(`Trigger APT for ${s.vehicleNo}: an APT already exists for this vehicle. Nothing was pressed.`);
  }

  const stages = s.stages ?? ["5.5", "6.0"];
  const expiry = s.expiry ?? (() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d; })();
  for (const stage of stages) {
    // The page is left after each press, so search again before every stage.
    await p.searchForTrigger(s.vehicleNo, s.companyRoc ?? "JM0570913-X");
    await p.trigger(stage, expiry);
  }
  return { stms, stages, apt: await findAptTransaction(bo, { vehicleNo: s.vehicleNo }) };
}

// -------------------------------------------------------------------- export

export interface ExportScenario {
  kind: BoListingKind;
  /** The Tx Status filter label, e.g. "Failed". */
  status: string;
  /** Where to save the CSV. Required — a run's downloads belong in its evidence folder. */
  saveTo: string;
  /** Default 2026-01-01 (the range the population checks used). */
  from?: Date;
  /** Default today. */
  to?: Date;
}

export interface ExportResult {
  file: string;
  rows: { tx: string; payment: string; status: string }[];
}

/** Export a listing filtered by Tx Status and parse the CSV. Read-only. */
export async function exportListing(bo: Page, s: ExportScenario): Promise<ExportResult> {
  const dl = await new BoTransactionsPage(bo).exportByStatus(s.kind, s.status, s.from ?? new Date(2026, 0, 1), s.to ?? new Date());
  fs.mkdirSync(path.dirname(s.saveTo), { recursive: true });
  await dl.saveAs(s.saveTo);
  return { file: s.saveTo, rows: parseExportCsv(s.saveTo) };
}

/** The export has preamble lines before the header row; find it by its "Payment" column. */
export function parseExportCsv(file: string): ExportResult["rows"] {
  const lines = fs.readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const split = (l: string) =>
    (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim());
  const hi = lines.findIndex((l) => split(l).includes("Payment"));
  if (hi === -1) throw new Error(`${file}: no header row with a "Payment" column — is this a transaction export?`);
  const head = split(lines[hi]);
  const ti = head.findIndex((h) => /^Transaction No/.test(h));
  const pi = head.indexOf("Payment");
  const si = head.indexOf("Tx Status");
  return lines.slice(hi + 1).map(split).filter((r) => r[ti]).map((r) => ({ tx: clean(r[ti]), payment: clean(r[pi]), status: clean(r[si]) }));
}
