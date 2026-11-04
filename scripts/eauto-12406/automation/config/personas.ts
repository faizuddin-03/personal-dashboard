/**
 * Personas — a role name a spec can ask for, mapped to the env keys holding
 * that account's credentials. No credential is ever written here; the values
 * live in env/.<TEST_ENV>.env-local (gitignored) or on the CI runner.
 *
 * `portal` decides which login screen and which home page the session lands
 * on. `destructive` marks accounts whose runs change records — those specs
 * must carry the @destructive tag and never run against production.
 *
 * Key names and env-key names match `eauto-qa-automation/config/personas.ts`
 * deliberately, so a spec written here needs no edit when this folder merges.
 */

import { ownLane, partnerLane, subLane } from "./lane-roster";

/** `cibo` = the Secarang / eAuto insurance back office (its own login, `pages/cibo/cibo-login.page.ts`). */
export type Portal = "ucd" | "bo" | "jpj" | "aatf" | "cibo";

export interface Persona {
  /** How a spec names it: `ucdSession('ucdE2E')`, or `login.as('ucdE2E')`. */
  key: string;
  portal: Portal;
  /** What this account is for, in words a reviewer can check. */
  role: string;
  usernameEnv: string;
  passwordEnv: string;
  destructive: boolean;
}

export const PERSONAS = {
  ucd: {
    key: "ucd",
    portal: "ucd",
    role: "Dealer, read-only listings and searches",
    usernameEnv: "UCD_USERNAME",
    passwordEnv: "UCD_PASSWORD",
    destructive: false,
  },
  ucdE2E: {
    key: "ucdE2E",
    portal: "ucd",
    role: "Dealer used for end-to-end journeys that create and transfer records — STMS, eSerahan",
    usernameEnv: "UCD_E2E_USERNAME",
    passwordEnv: "UCD_E2E_PASSWORD",
    destructive: true,
  },
  ucdE2E2: {
    key: "ucdE2E2",
    portal: "ucd",
    role:
      "SECOND dealer — only for flows that need two UCDs (UCD to UCD: the other party " +
      "to ucdE2E, e.g. Interstate buyer UCD B). Never use it as a general-purpose account",
    usernameEnv: "UCD2_E2E_USERNAME",
    passwordEnv: "UCD2_E2E_PASSWORD",
    destructive: true,
  },
  ucdE2E3: {
    key: "ucdE2E3",
    portal: "ucd",
    role:
      "Runner lane 3 dealer: AzfarL3, Sub UCD (Administrator) of AZFARAZO, the same company as ucdE2E. " +
      "Created by Claude 21.10.2026 with Azfar's permission; card CARDS.ucdE2E3Rep (simulator identity)",
    usernameEnv: "UCD3_E2E_USERNAME",
    passwordEnv: "UCD3_E2E_PASSWORD",
    destructive: true,
  },
  ucdE2E4: {
    key: "ucdE2E4",
    portal: "ucd",
    role:
      "Runner lane 4 dealer: AzfarL4, Sub UCD (Administrator) of AZFARAZO, the same company as ucdE2E. " +
      "Created by Claude 21.10.2026 with Azfar's permission; card CARDS.ucdE2E4Rep (simulator identity)",
    usernameEnv: "UCD4_E2E_USERNAME",
    passwordEnv: "UCD4_E2E_PASSWORD",
    destructive: true,
  },
  ucdCo1: {
    key: "ucdCo1",
    portal: "ucd",
    role:
      "Main user AzfarCo1 of QA company QA AUTO MOTOR SATU SDN BHD (1576859-H, company ID 1019420, valid TIN), created by Claude in BO " +
      "21.10.2026 with Azfar's permission. Needs Dev's company-ID patch for the MyKad emulator before any card step",
    usernameEnv: "QA_CO1_USERNAME",
    passwordEnv: "QA_CO1_PASSWORD",
    destructive: true,
  },
  ucdCo2: {
    key: "ucdCo2",
    portal: "ucd",
    role:
      "Main user AzfarCo2 of QA company QA AUTO MOTOR DUA SDN BHD (1644516-X, company ID 1019421, valid TIN), created by Claude in BO " +
      "21.10.2026 with Azfar's permission. Needs Dev's company-ID patch for the MyKad emulator before any card step",
    usernameEnv: "QA_CO2_USERNAME",
    passwordEnv: "QA_CO2_PASSWORD",
    destructive: true,
  },
  ucdCo3: {
    key: "ucdCo3",
    portal: "ucd",
    role:
      "Main user AzfarCo3 of QA company QA AUTO MOTOR TIGA SDN BHD (788079-P, company ID 1019422, INVALID TIN on purpose), created by Claude in BO " +
      "21.10.2026 with Azfar's permission. Needs Dev's company-ID patch for the MyKad emulator before any card step",
    usernameEnv: "QA_CO3_USERNAME",
    passwordEnv: "QA_CO3_PASSWORD",
    destructive: true,
  },
  ucdCo4: {
    key: "ucdCo4",
    portal: "ucd",
    role:
      "Main user AzfarCo4 of QA company QA AUTO MOTOR EMPAT ENTERPRISE (003369080-P, company ID 1019423, sole proprietor ROC), created by Claude in BO " +
      "21.10.2026 with Azfar's permission. Needs Dev's company-ID patch for the MyKad emulator before any card step",
    usernameEnv: "QA_CO4_USERNAME",
    passwordEnv: "QA_CO4_PASSWORD",
    destructive: true,
  },
  ucdCo5: {
    key: "ucdCo5",
    portal: "ucd",
    role:
      "Main user AzfarCo5 of QA company QA AUTO MOTOR LIMA SDN BHD (1433966-U, company ID 2120546, Sabah mailing address), created by Claude in BO " +
      "21.10.2026 with Azfar's permission. Needs Dev's company-ID patch for the MyKad emulator before any card step",
    usernameEnv: "QA_CO5_USERNAME",
    passwordEnv: "QA_CO5_PASSWORD",
    destructive: true,
  },
  ucdCo6: {
    key: "ucdCo6",
    portal: "ucd",
    role:
      "Main user AzfarCo6 = Azfar himself (MyKad 020406081081, his REAL card) of QA company QA AUTO MOTOR ENAM SDN BHD (1576171-W, " +
      "company ID 1019424, Johor mailing address), created by Claude in BO 22.10.2026 with Azfar's permission. NOT a lane (not in " +
      "lanes.json), NOT patched for the emulator: every card / thumbprint step is Azfar by hand on the real reader (DERMALOG " +
      "MyBioID). Only for the manual-reader specs (EAINT-12253 FF_TS6 / BEH_TS6, CR_MANUAL=1)",
    usernameEnv: "QA_CO6_USERNAME",
    passwordEnv: "QA_CO6_PASSWORD",
    destructive: true,
  },
  ucdCo1Sub: {
    key: "ucdCo1Sub",
    portal: "ucd",
    role: "Sub UCD (Administrator) AzfarCo1S of QA company Co1 (company ID 1019420), lane 10; created by Claude 21.10.2026",
    usernameEnv: "QA_CO1S_USERNAME",
    passwordEnv: "QA_CO1S_PASSWORD",
    destructive: true,
  },
  ucdCo2Sub: {
    key: "ucdCo2Sub",
    portal: "ucd",
    role: "Sub UCD (Administrator) AzfarCo2S of QA company Co2 (company ID 1019421), lane 11; created by Claude 21.10.2026",
    usernameEnv: "QA_CO2S_USERNAME",
    passwordEnv: "QA_CO2S_PASSWORD",
    destructive: true,
  },
  aatf: {
    key: "aatf",
    portal: "aatf",
    role:
      "AATF user (eDEREG: Deregistration, e-Dereg Pre-Checking). Added 20.10.2026 for EAINT-12253; " +
      "credentials not yet in env (staging account azfaraatf per knowledge/portals/aatf/portal.md)",
    usernameEnv: "AATF_USERNAME",
    passwordEnv: "AATF_PASSWORD",
    // Creating a pre-check or a deregistration spends a vehicle and can charge RHB.
    destructive: true,
  },
  bo: {
    key: "bo",
    portal: "bo",
    role: "BackOffice reviewer — approves Pre-Applications and Applications",
    usernameEnv: "BO_USERNAME",
    passwordEnv: "BO_PASSWORD",
    // Approving is ONE-SHOT: an approved Pre-Application has fired its emails
    // and cannot be re-approved, so a run that approves has spent that record.
    destructive: true,
  },
  boAdmin: {
    key: "boAdmin",
    portal: "bo",
    role: "BackOffice hub administrator — the ASSIGNEE half of the onboarding workflow",
    usernameEnv: "BO_ADMIN_USERNAME",
    passwordEnv: "BO_ADMIN_PASSWORD",
    // Presses "Submit for Approval", which moves an Application to Pending.
    destructive: true,
  },
  cibo: {
    key: "cibo",
    portal: "cibo",
    role:
      "CIBO admin (the shared QA login 'Test Admin', full menu; Azfar 28.10.2026): reads Secarang and eAuto " +
      "insurance transactions, payments, reports and CRM. NOT an eAuto login: sign in with CiboLoginPage (in a CR " +
      "spec: ts.portal('cibo'), which uses it), never LoginPage. The flows use it read-only (no Save, Edit, " +
      "Duplicate, Send, Create, Export)",
    usernameEnv: "CIBO_USERNAME",
    passwordEnv: "CIBO_PASSWORD",
    // The account itself can change staff accounts and CRM records; nothing in src/ presses those buttons.
    destructive: false,
  },
} as const satisfies Record<string, Persona>;

export type PersonaKey = keyof typeof PERSONAS;

/** The persona, or a message naming what is missing rather than `undefined`. */
export function persona(key: PersonaKey): Persona {
  const found = PERSONAS[key];
  if (!found) {
    throw new Error(
      `No persona named "${key}". Known personas: ${Object.keys(PERSONAS).join(", ")}.`,
    );
  }
  return found;
}

/**
 * The dealer persona for the run's lane (`LANE`, roster env/lanes.json). Unset = lane 1. A lane the roster does
 * not list fails by name rather than silently landing on lane 1.
 */
export function lanePersona(): PersonaKey {
  return ownLane().persona as PersonaKey;
}

/** UCD B of a UCD to UCD run: a held lane of another company (config/lane-roster.ts `partnerLane`). */
export function partnerPersona(): PersonaKey {
  return partnerLane().persona as PersonaKey;
}

/** The sub user of the run's own company, for main vs sub cases (`subLane`). */
export function subPersona(): PersonaKey {
  return subLane().persona as PersonaKey;
}

/**
 * The Secarang staging SITE password (a password-only page in front of /ia/ and /preprod/; no user login).
 * Not a persona, because nobody signs in: it only opens the site. Fails by name when blank, like credentials().
 */
export function secarangSitePassword(): string {
  const value = process.env.SECARANG_SITE_PASSWORD;
  if (!value) {
    throw new Error("SECARANG_SITE_PASSWORD must be set in env/.<TEST_ENV>.env-local (ask the QA team for the Secarang staging site password).");
  }
  return value;
}

/**
 * The credentials for a persona, or an error that says which env key is blank.
 *
 * A missing password must fail here, by name, rather than as an empty string
 * typed into a login form — that failure looks like a product defect.
 */
export function credentials(key: PersonaKey): { username: string; password: string } {
  const p = persona(key);
  const username = process.env[p.usernameEnv];
  const password = process.env[p.passwordEnv];
  if (!username || !password) {
    const missing = [!username && p.usernameEnv, !password && p.passwordEnv].filter(Boolean);
    throw new Error(
      `Persona "${key}" (${p.role}) is not configured: ${missing.join(" and ")} ` +
        "must be set in env/.<TEST_ENV>.env-local.",
    );
  }
  return { username, password };
}
