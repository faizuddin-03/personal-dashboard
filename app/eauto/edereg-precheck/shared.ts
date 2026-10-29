// Types/constants shared between page.tsx and BulkRunPanel.tsx — split out
// so BulkRunPanel (which needs TEST_CASES/VPN_GATE_SKIP_TEST_CASES/FormState/
// RunResponse) doesn't have to import them FROM page.tsx, which itself
// imports BulkRunPanel to render it. That would be a circular import; this
// module has no dependency on either.

export interface PrecheckLegResult {
  jpjStatusLabel?: string; responseDesc?: string; transactionId?: string;
}
export interface DeregLegResult {
  jpjCheckStatus?: string; jpjCheckResponseCode?: string;
  jpjDeregistrationStatus?: string; transactionId?: string;
}
export interface InlineRetryResult {
  satisfied?: boolean; usedInlinePrecheck?: boolean; jpjStatus?: string; responseDesc?: string;
}
export interface PaymentAttemptResult {
  declined?: boolean; jpjStatus?: string; responseDesc?: string;
}
export interface DetailsCheckResult {
  vehicleRegNo?: string; trxStatus?: string; responseDesc?: string;
  paymentRowCount?: number; paymentRowsAllOk?: boolean;
}
export interface PrecheckLinkCheckResult {
  href?: string; listingVehicleNoValue?: string; listingHasRows?: boolean; deregRefNo?: string;
}
export interface JpjXmlLogCheckResult {
  precheckLog?: { refNo?: string; foundByVehicleNo?: number; foundByRefNo?: number; responseCodeMatches?: boolean };
  deregLog?: { refNo?: string; foundByVehicleNo?: number; foundByRefNo?: number };
}

export type TestCase =
  | "happy-path" | "vehicle-not-exist" | "rhb-api-down" | "ts3"
  | "step2-first-approved" | "step2-first-vehicle-not-exist" | "step2-first-retry-approved"
  | "ts4-part1" | "ts4-part2" | "ts5-part1" | "ts5-part2" | "ts6-part1" | "ts6-part2"
  | "ts10-part1" | "ts10-part2" | "ts11-part1" | "ts11-part2" | "ts12-part1" | "ts12-part2"
  | "am" | "of" | "of-ts5" | "of-ts4"
  | "mu-ts1" | "mu-ts2" | "mu-ts3" | "mu-ts4" | "mu-ts5" | "mu-ts6" | "mu-ts7" | "mu-ts8" | "mu-ts9" | "mu-ts9b" | "mu-ts10"
  | "mu-ts11" | "mu-ts12"
  | "cj-ts1-part1" | "cj-ts1-part2" | "cj-ts2-part1" | "cj-ts2-part2"
  | "cj-ts3-part1" | "cj-ts3-part2" | "cj-ts4-part1" | "cj-ts4-part2"
  | "cj-ts5-part1" | "cj-ts5-part2"
  | "ec-ts1" | "ec-ts2" | "ec-ts4" | "ec-ts5";

export interface RunResult {
  status?: string; vehicleRegNo?: string; envSegment?: string; finalUrl?: string;
  precheck?: PrecheckLegResult; deregistration?: DeregLegResult; inlineRetry?: InlineRetryResult;
  firstAttempt?: InlineRetryResult; secondAttempt?: InlineRetryResult;
  paymentAttempts?: PaymentAttemptResult[];
  detailsCheck?: DetailsCheckResult; precheckLinkCheck?: PrecheckLinkCheckResult;
  jpjXmlLogCheck?: JpjXmlLogCheckResult;
  tsNo?: string; part?: number; transactionId?: string; responseDesc?: string;
  nextAction?: string; continuesAs?: TestCase;
}
export interface RunResponse {
  result?: RunResult; error?: string; stopped?: boolean; log?: string;
  videos?: { label: string; url: string }[];
  progress?: { step: string; status: string; label?: string }[];
}

export type FormState = {
  envSegment: string; vehicleRegNo: string; jpjReceiptEmail: string;
  username: string; password: string; subUsername: string; subPassword: string;
  mykadNric: string; mykadName: string; mykadNricSub: string; mykadNameSub: string;
  subUsername2: string; subPassword2: string; mykadNricSub2: string; mykadNameSub2: string;
  testCase: TestCase;
};

// Each ticket case is its own Playwright project (playwright.config.ts) so
// the dashboard route's single-test PROGRESS:/RESULT: parsing never mixes
// two tests' output — see knowledge/flow-edereg.md §9. Part-2 continuations
// are NOT listed here — they're generated dynamically, one per completed
// Part 1 run (see page.tsx's PendingContinuation).
export const TEST_CASES: { value: TestCase; label: string; group: string; skipVpnGate?: boolean; multiUser?: "same" | "different" }[] = [
  { value: "happy-path", label: "CPC_E2E_TS1 — Approved (happy path)", group: "E2E" },
  { value: "vehicle-not-exist", label: "CPC_E2E_TS2 — Failed, Vehicle Not Exist → repurchase → complete", group: "E2E" },
  // "rhb-api-down" deliberately hidden from the picker, 2026-09-02, per Faizuddin —
  // it was never actually CPC_E2E_TS3 (that's "ts3" below now); left unlisted with
  // no confirmed TS number rather than deleted. Project/route/spec still work.
  // { value: "rhb-api-down", label: "[TS TBD] — Failed, RHB API Down (standalone enquiry payment decline)", group: "E2E" },
  { value: "ts3", label: "CPC_E2E_TS3 — Failed, JPJ error code (VEL000045E)", group: "E2E" },
  { value: "ts4-part1", label: "CPC_E2E_TS4 — Part 1 (Approved, then hand off for expiry patch)", group: "E2E" },
  { value: "ts5-part1", label: "CPC_E2E_TS5 — Part 1 (Failed, then hand off for expiry patch)", group: "E2E" },
  { value: "ts6-part1", label: "CPC_E2E_TS6 — Part 1 (Failed, then hand off for expiry patch)", group: "E2E" },
  { value: "step2-first-approved", label: "CPC_E2E_TS7 — Approved (pre-check done in step 2)", group: "E2E" },
  { value: "step2-first-vehicle-not-exist", label: "CPC_E2E_TS8 — Failed, Vehicle Not Exist (step 2) → repurchase → complete", group: "E2E" },
  { value: "step2-first-retry-approved", label: "CPC_E2E_TS9 — Failed, then re-entry reshows the same result (pre-check done in step 2)", group: "E2E" },
  { value: "ts10-part1", label: "CPC_E2E_TS10 — Part 1 (pre-check done in step 2, then hand off for expiry patch)", group: "E2E" },
  { value: "ts11-part1", label: "CPC_E2E_TS11 — Part 1 (pre-check done in step 2, then hand off for expiry patch)", group: "E2E" },
  { value: "ts12-part1", label: "CPC_E2E_TS12 — Part 1 (pre-check done in step 2, then hand off for expiry patch)", group: "E2E" },
  { value: "am", label: "AM_TS1-4 — Announcement Message banner (Home / eDEREG / Create Deregistration, with & without popup)", group: "Announcement Message", skipVpnGate: true },
  { value: "of", label: "OF_TS1-3 — Cancel inline pre-check popup, blank Vehicle No. validation, Vehicle No. input shaping", group: "Other Functions", skipVpnGate: true },
  { value: "of-ts5", label: "OF_TS5 — JPJ XML Log (inline pre-check purchase, then BO log search by Vehicle No. & Ref No.)", group: "Other Functions" },
  { value: "of-ts4", label: "OF_TS4 — RHB IF decline, dev resets payment on the SAME transaction, retrigger, then Approved (single run — pauses mid-flow for the dashboard's Continue button instead of a Part 1/Part 2 split)", group: "Other Functions" },
  { value: "mu-ts1", label: "MU_TS1 — Same company: User A pre-check only, User B reuses it through a full Deregistration", group: "Multiple Users", multiUser: "same" },
  { value: "mu-ts2", label: "MU_TS2 — Different company: User A pre-check only, User C buys their own and completes a full Deregistration", group: "Multiple Users", multiUser: "different" },
  { value: "mu-ts3", label: "MU_TS3 — Different company, RE decline: independent countdowns, User C retries through to Approved", group: "Multiple Users", multiUser: "different" },
  { value: "mu-ts4", label: "MU_TS4 — Same company, IF decline: concurrent retry race via Resubmit on the existing transaction", group: "Multiple Users", multiUser: "same" },
  { value: "mu-ts5", label: "MU_TS5 — Different company, JPJ-Failed isolation: User A redo Approved must not leak into User C's redo", group: "Multiple Users", multiUser: "different" },
  { value: "mu-ts6", label: "MU_TS6 — Same company: User A's Failed pre-check reshows on User B's own fresh attempt too (company-scoped)", group: "Multiple Users", multiUser: "same" },
  { value: "mu-ts7", label: "MU_TS7 — Different company: User A resumes an abandoned pre-check after User B buys their own in between", group: "Multiple Users", multiUser: "different" },
  { value: "mu-ts8", label: "MU_TS8 — Same company: User A's inline popup races User B's listing-side resume, same first-ever payment attempt", group: "Multiple Users", multiUser: "same" },
  { value: "mu-ts9", label: "MU_TS9 — Same company: BackOffice cancels the transaction while User A (declined IF) and User B (listing resume) still have it open", group: "Multiple Users", multiUser: "same" },
  // "mu-ts9b" deliberately hidden from the picker, 2026-08-27, per Faizuddin
  // ("hide ts9b from the dashboard, but dont remove it, i might need it
  // again in the future") — the project/route/spec/page-object all still
  // exist and work, just not listed here. Re-add this line to bring it
  // back:
  // { value: "mu-ts9b", label: "MU_TS9B — Same as MU_TS9, but User A uses the standalone Pre-Checking flow instead of the Deregistration-embedded popup (comparison build)", group: "Multiple Users", multiUser: "same" },
  { value: "mu-ts10", label: "MU_TS10 — Different company: BackOffice cancels BOTH companies' separate transactions; each resubmits/retries into Transaction Cancelled", group: "Multiple Users", multiUser: "different" },
  { value: "mu-ts11", label: "MU_TS11 — Different company: both create a Pending pre-check, wait for cronjob expiry, then attempt resubmit from an Expired row (single run — pauses mid-flow for the dashboard's Continue button instead of a Part 1/Part 2 split)", group: "Multiple Users", multiUser: "different" },
  { value: "mu-ts12", label: "MU_TS12 — Same company: User A's Failed (IF) payment expires via cronjob while User B still has the shared transaction's Payment page open, then both attempt to pay/retry into an Expired row (single run, dashboard Continue button)", group: "Multiple Users", multiUser: "same" },
  { value: "cj-ts1-part1", label: "CJ_TS1 — Part 1 (Failed via RHB IF, then hand off for cronjob expiry)", group: "Cronjob" },
  { value: "cj-ts2-part1", label: "CJ_TS2 — Part 1 (Failed via JPJ error, then hand off for cronjob no-op check)", group: "Cronjob" },
  { value: "cj-ts3-part1", label: "CJ_TS3 — Part 1 (Approved, then hand off for a DB-patched Expired status + cronjob no-op check)", group: "Cronjob" },
  { value: "cj-ts4-part1", label: "CJ_TS4 — Part 1 (Approved, then hand off for cronjob no-op check)", group: "Cronjob" },
  { value: "cj-ts5-part1", label: "CJ_TS5 — Part 1 (Pending, never paid, then hand off for cronjob expiry)", group: "Cronjob" },
  // "Extra" — added 2026-08-28, from the dev-authored QA test guide's own
  // scenario list (_reference/tickets/EAINT-9306/EAINT-9306-artifact-qa-test-guide-from-dev.html),
  // cross-checked against every existing TS in this suite. These fill gaps
  // the dev guide calls out that the numbered MU_TS/CPC_E2E_TS/OF_TS/CJ_TS/
  // AM_TS test-plan cases don't already cover — not part of the original
  // 38-case script, but the same "raise coverage, don't just report it"
  // instinct.
  { value: "ec-ts1", label: "EC_TS1 — A later failed precheck does not undo an earlier approved one (fresh Deregistration must still be allowed)", group: "Extra Coverage" },
  { value: "ec-ts2", label: "EC_TS2 — An abandoned (never-paid) precheck is reused, not duplicated, and stays blocked on a repeat attempt", group: "Extra Coverage" },
  { value: "ec-ts4", label: "EC_TS4 — An existing BackOffice-cancelled precheck still blocks a fresh Deregistration", group: "Extra Coverage" },
  { value: "ec-ts5", label: "EC_TS5 — A failed-payment precheck resumes in retry mode with its Payment History, via a genuine cancel-and-return", group: "Extra Coverage" },
];

// Test cases that never touch utils/esim.ts, so the VPN gate can be
// skipped entirely — added 2026-08-28, per Faizuddin. Covers dynamically
// generated Part 2 continuations that never appear in TEST_CASES at all
// (so its own `skipVpnGate` flag can't reach them): CJ_TS1-5's own Part 2
// is a pure listing read — it never calls setRhbTransferCode()/
// ensureEsimHappyPath()/etc. Every OTHER two-part case's Part 2
// (ts4/5/6/10/11/12-part2) DOES re-steer eSIM to retry payment, so those
// are deliberately NOT in this set — confirmed by grepping each Part 2
// spec for an `utils/esim` import.
export const VPN_GATE_SKIP_TEST_CASES = new Set<TestCase>([
  "cj-ts1-part2", "cj-ts2-part2", "cj-ts3-part2", "cj-ts4-part2", "cj-ts5-part2",
]);

// One entry per completed Part 1 run — Part 1 can run multiple times with
// different vehicle numbers, so each run's continuation is tracked
// separately rather than collapsing into one static "Part 2" option.
// Written by BOTH page.tsx (a single Part 1 run) and BulkRunPanel.tsx (a
// Part 1 test case picked inside a bulk batch) into the SAME localStorage
// list, so either path surfaces the same "send these details to dev, then
// run the continuation" entry.
export interface PendingContinuation {
  id: string;
  tsNo: string;
  part2TestCase: TestCase;
  vehicleRegNo: string;
  transactionId: string;
  createdAt: number;
}
export const CONTINUATIONS_KEY = "edereg_precheck_continuations";

// Test cases with a real ~6.5-minute RE payment-reset-timer wait built in
// (DeregTransactionPage.waitOutPaymentResetTimer) — confirmed by grepping
// every spec for waitOutPaymentResetTimer()/RESET_TIMER usage (CPC_E2E_TS5
// Part 2, MU_TS3). BulkRunPanel runs these LAST in a batch so the long
// fixed wait doesn't sit in front of faster test cases queued behind it.
export const RE_WAIT_TEST_CASES = new Set<TestCase>(["ts5-part2", "mu-ts3"]);

// Grouped once, in TEST_CASES' own order — both the single-select picker
// (page.tsx) and the multi-select bulk-run list (BulkRunPanel.tsx) render one
// collapsible section per group instead of a flat list (too many cases now
// to show unfiltered, per Faizuddin 2026-08-26).
export const TEST_CASE_GROUPS: { group: string; cases: typeof TEST_CASES }[] = (() => {
  const groups: { group: string; cases: typeof TEST_CASES }[] = [];
  for (const tc of TEST_CASES) {
    const last = groups[groups.length - 1];
    if (last && last.group === tc.group) last.cases.push(tc);
    else groups.push({ group: tc.group, cases: [tc] });
  }
  return groups;
})();
