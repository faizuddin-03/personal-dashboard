// EAINT-12257 — the selection model shared by both tabs.
//
// The scenario is picked FIRST, on the Test Script tab, and what it needs then
// drives the Checker tab: a selection that needs real company data gets a "Use"
// button on every passing row, one that doesn't gets no button at all. Keeping
// that rule in one place is the point of this file — two tabs disagreeing about
// what a scenario requires is how you end up pressing Use and nothing happening.

/** /obs sits OUTSIDE the instance path, so this flow takes the bare host. */
export const ENV_PRESETS = [
  { label: "staging", value: "https://staging.eauto.my" },
] as const;

/**
 * `ssm: true` means the type posts its BRN to /obs/preOnb/checkSSM.do — a LIVE
 * lookup against the real SSM registry. Nothing generated passes it, so those
 * three need a real company cleared by the Checker. Without one the form does
 * not error; it silently switches to Business Trading (Sabah).
 */
export const BUSINESS_TYPES = [
  { value: "TRADING_SARAWAK", label: "Business Trading (Sarawak)", ssm: false },
  { value: "TRADING_SABAH", label: "Business Trading (Sabah)", ssm: false },
  { value: "SDN_BHD", label: "Sdn Bhd / Bhd", ssm: true },
  { value: "SOLE_PROPRIETORSHIP_PARTNERSHIP", label: "Sole Proprietorship / Partnership", ssm: true },
  { value: "LLP", label: "LLP", ssm: true },
] as const;

export type BusinessTypeValue = (typeof BUSINESS_TYPES)[number]["value"];

export interface TestCase {
  value: string;
  /** MUST match the spec's test() title exactly — the runner greps by it. */
  title: string;
  label: string;
  /** Walks the full chain, so it needs the two BackOffice logins. */
  needsBo: boolean;
  /** UI preview only: Run simulates, nothing is spawned. */
  dummy?: boolean;
  /** Asks for a Checker company on every business type, not just the SSM ones. */
  alwaysNeedsChecker?: boolean;
}

export const TEST_CASES: readonly TestCase[] = [
  {
    value: "TS01",
    title: "12257_TS01: Pre-application fee paid with DuitNow QR",
    label: "12257_TS01 — Pre-application fee (RM 108) by QR",
    needsBo: false,
  },
  {
    value: "TS02",
    title: "12257_TS02: Registration fee paid with DuitNow QR",
    label: "12257_TS02 — Registration fee (RM 990) by QR",
    needsBo: true,
  },
  // UI PREVIEW ONLY — no spec, no backend. Selecting it exercises every part of
  // the page (the Checker handover, the BackOffice column, the live log, the
  // result card) against a fake run, so the layout can be judged without
  // spending a reCAPTCHA tick, a phone scan and RM 1,098 of sandbox payment.
  // Delete this entry and the `dummy`/`alwaysNeedsChecker` branches with it once
  // the real scenarios are running.
  {
    value: "TS99",
    title: "12257_TS99: Dummy — UI preview only",
    label: "12257_TS99 — Dummy (UI preview, runs nothing)",
    needsBo: true,
    dummy: true,
    alwaysNeedsChecker: true,
  },
];

export const findCase = (v: string) => TEST_CASES.find(t => t.value === v) ?? TEST_CASES[0];
export const findType = (v: string) => BUSINESS_TYPES.find(t => t.value === v) ?? BUSINESS_TYPES[0];

/** One field the Checker supplies, and what the form calls it. */
export interface CheckerField {
  /** Key on the picked row. */
  from: "roc" | "newRoc" | "tin";
  /** The checker's column name. */
  source: string;
  /** What the eAuto form calls it. */
  target: string;
}

export interface CheckerNeed {
  fields: CheckerField[];
  /** Shown on the Checker tab so it is obvious why Use is offered. */
  reason: string;
}

/**
 * What the current selection needs from the Checker — or null if it needs
 * nothing, in which case the Checker offers no Use button.
 *
 * Today only the business type decides this, but the scenario is taken as an
 * argument because that is the axis expected to grow: a later TS may need
 * checked data on a non-SSM type, or none on an SSM one.
 */
export function checkerNeed(testCase: string, businessType: string): CheckerNeed | null {
  const kase = findCase(testCase);
  const type = findType(businessType);

  // The dummy asks for checked data on every business type — that is the whole
  // point of it, since it is how the scenario-driven behaviour is demonstrated.
  const always = kase.alwaysNeedsChecker === true;
  if (!always && !type.ssm) return null;

  return {
    fields: [
      { from: "roc", source: "Company ROC", target: "Old BRN" },
      { from: "newRoc", source: "New Company ROC", target: "New BRN" },
      { from: "tin", source: "TIN Number", target: "TIN" },
    ],
    reason: always
      ? `${kase.value} is a UI preview and always asks for a company, so the handover can be seen on any business type.`
      : `${kase.value} on ${type.label} needs a real company — nothing generated passes the live SSM lookup.`,
  };
}
