import { BUSINESS_TYPE, type BusinessType } from "@pages/obs/pre-application.page";
import type { SsmType } from "@data/ssm";

/**
 * Everything one onboarding build types into the product, made once and kept
 * on the checkpoint — so a resumed build uses the same dealer it started with.
 *
 * Every identity field carries the run id. Two builds must never be
 * indistinguishable, in the listing or in a shared mail inbox.
 */
export interface OnboardingProfile {
  runId: string;
  businessType: BusinessType;
  businessName: string;
  /** SSM types only — the seeded company's numbers. */
  ssmType?: SsmType;
  oldBrn?: string;
  newBrn?: string;
  /** Business Trading types only. */
  tradingLicenceNo?: string;
  /**
   * What the Application should render as director rows — the seeding's
   * prediction. Absent for Business Trading, which has no SSM document to
   * count from.
   */
  expectedDirectors?: number;
  showroomAddress: string;
  showroomPostcode: string;
  showroomState: string;
  showroomCity: string;
  adminName: string;
  mobileNo: string;
  adminEmail: string;
  tin: string;
  /**
   * True when ROC, new ROC and TIN are a real matching trio from the
   * test-company list — then LHDN must ACCEPT the TIN, and its "TIN is
   * invalid" warning is a failure rather than the expected noise.
   */
  tinMustVerify?: boolean;
  directorName: string;
  /** Typed only for Business Trading — an SSM company's comes from its document. */
  directorMyKad: string;
  directorMobile: string;
  directorEmail: string;
  picMyKad: string;
}

/** Every business type a build can take, by the short name the driver accepts. */
export const ONBOARDING_TYPE = {
  ROC: BUSINESS_TYPE.ROC,
  ROB: BUSINESS_TYPE.ROB,
  LLP: BUSINESS_TYPE.LLP,
  SABAH: BUSINESS_TYPE.TRADING_SABAH,
  SARAWAK: BUSINESS_TYPE.TRADING_SARAWAK,
} as const;

export type OnboardingType = keyof typeof ONBOARDING_TYPE;

export const isSsmType = (t: OnboardingType): t is SsmType => t === "ROC" || t === "ROB" || t === "LLP";

/** What the company is called, per type — for a name that reads right in the listing. */
const SUFFIX: Record<OnboardingType, string> = {
  ROC: "SDN BHD",
  ROB: "ENTERPRISE",
  LLP: "PLT",
  SABAH: "TRADING",
  SARAWAK: "TRADING",
};

/**
 * Licence numbers in the shape each state issues — `KK/1234567` (Sabah),
 * `KCH/1234567` (Sarawak). The form accepts letters, digits and `/`, min 4.
 */
const LICENCE_PREFIX = { SABAH: "KK", SARAWAK: "KCH" } as const;

/**
 * Where a Business Trading showroom can be. The licence's state DECIDES it:
 * with Business Trading (Sarawak) chosen, the state list offers SARAWAK and
 * nothing else, pre-selected, and the cities are Sarawak towns (observed
 * 2026-09-23 — a Selangor showroom could not be chosen at all). Sabah is
 * assumed to mirror it; its city label has not been observed yet.
 */
const TRADING_SHOWROOM = {
  SARAWAK: { showroomState: "SARAWAK", showroomCity: "KUCHING", showroomPostcode: "93000" },
  SABAH: { showroomState: "SABAH", showroomCity: "KOTA KINABALU", showroomPostcode: "88000" },
} as const;

function base(runId: string, type: OnboardingType) {
  const lower = runId.toLowerCase();
  return {
    runId,
    businessType: ONBOARDING_TYPE[type],
    businessName: `QA E2E ${runId} ${SUFFIX[type]}`,
    showroomAddress: "NO 1, JALAN UJIAN",
    showroomPostcode: "43000",
    showroomState: "SELANGOR",
    showroomCity: "BATU CAVES",
    adminName: "AZFAR QA",
    mobileNo: "0123456789",
    adminEmail: `azfar.qa.${lower}@modefair.com`,
    directorName: "QA DIRECTOR A",
    directorMyKad: "750101145678",
    directorMobile: "0123456789",
    directorEmail: `azfar.dir.${lower}@modefair.com`,
    picMyKad: "690501137631",
  };
}

const newRunId = () => Date.now().toString(36).toUpperCase();

/**
 * A profile on a company seeded into eSim's SSM simulator. With a real TIN
 * (from the test-company list) the TIN must verify; without one, the new BRN
 * stands in — it passes the format check, and LHDN rejects it.
 */
export function ssmProfile(
  company: { type: SsmType; roc: string; newRoc: string; expectedDirectors: number },
  realTin?: string,
): OnboardingProfile {
  return {
    ...base(newRunId(), company.type),
    ssmType: company.type,
    oldBrn: company.roc,
    newBrn: company.newRoc,
    expectedDirectors: company.expectedDirectors,
    tin: realTin ?? company.newRoc,
    tinMustVerify: Boolean(realTin),
  };
}

/** A Business Trading profile — nothing to seed, the licence is ours to invent. */
export function tradingProfile(type: "SABAH" | "SARAWAK"): OnboardingProfile {
  const runId = newRunId();
  const digits = String(Date.now()).slice(-7);
  return {
    ...base(runId, type),
    ...TRADING_SHOWROOM[type],
    tradingLicenceNo: `${LICENCE_PREFIX[type]}/${digits}`,
    // An individual-style TIN: letter + digits, the shape LHDN issues.
    tin: `IG${String(Date.now()).slice(-11)}`,
  };
}
