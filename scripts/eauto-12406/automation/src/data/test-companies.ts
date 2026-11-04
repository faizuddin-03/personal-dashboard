import * as fs from "node:fs";
import * as path from "node:path";
import { listCheckpoints, readCheckpoint } from "@fixtures/checkpoint";
import type { SsmType } from "@data/ssm";

/**
 * Real companies to onboard with — ROC, new ROC and TIN that belong together.
 *
 * Why real ones: since 2026-09-23 the TIN check passes only when the three are
 * a REAL, MATCHING trio. A generated `QA…` company still resolves in eSim, but
 * its TIN can no longer get through. The directors are still ours — eSim is
 * configured with the real numbers and seeded people, as before.
 *
 * The list lives in `env/test-companies.local.json`, GITIGNORED like the env
 * file beside it: these are real tax identifiers, and they do not belong in a
 * repository. `env/test-companies.example.json` shows the shape.
 */

export const TEST_COMPANIES_FILE = path.join(__dirname, "..", "..", "env", "test-companies.local.json");

export interface TestCompany {
  type: SsmType;
  /** Old-format registration number, as SSM writes it (e.g. `1234567-A`). */
  roc: string;
  /** New-format, 12 digits. */
  newRoc: string;
  tin: string;
  companyName?: string;
}

/**
 * Digits 5–6 of a new-format BRN are SSM's entity code, so the type can be
 * CHECKED against the number: 01/02 company (local/foreign), 03 business,
 * 04/05/06 LLP (local/foreign/professional).
 */
const ENTITY_CODE: Record<string, SsmType> = { "01": "ROC", "02": "ROC", "03": "ROB", "04": "LLP", "05": "LLP", "06": "LLP" };

/** Read and check the list. Throws with the file's path and what is wrong. */
export function loadTestCompanies(file = TEST_COMPANIES_FILE): TestCompany[] {
  if (!fs.existsSync(file)) {
    throw new Error(
      `No test-company list at ${file}. SSM builds need real ROC / new ROC / TIN trios since the ` +
        "TIN check started matching them — copy env/test-companies.example.json and fill it in.",
    );
  }
  const list = JSON.parse(fs.readFileSync(file, "utf8")) as TestCompany[];
  const problems: string[] = [];
  list.forEach((c, i) => {
    const at = `entry ${i + 1} (${c.roc ?? "no roc"})`;
    if (!["ROC", "ROB", "LLP"].includes(c.type)) problems.push(`${at}: type must be ROC, ROB or LLP`);
    if (!c.roc) problems.push(`${at}: roc is missing`);
    if (!/^\d{12}$/.test(c.newRoc ?? "")) problems.push(`${at}: newRoc must be 12 digits`);
    if (!c.tin) problems.push(`${at}: tin is missing`);
    const code = (c.newRoc ?? "").slice(4, 6);
    if (ENTITY_CODE[code] && c.type !== ENTITY_CODE[code]) {
      problems.push(`${at}: new BRN entity code ${code} means ${ENTITY_CODE[code]}, not ${c.type}`);
    }
  });
  if (problems.length) throw new Error(`${file} has problems:\n  ${problems.join("\n  ")}`);
  return list;
}

/** ROCs an earlier build already put through a Pre-Application. */
export function spentRocs(): Set<string> {
  const spent = new Set<string>();
  for (const label of listCheckpoints()) {
    try {
      const cp = readCheckpoint<{ oldBrn?: string }>(label);
      if (cp.phases.preapp && cp.profile?.oldBrn) spent.add(cp.profile.oldBrn);
    } catch {
      // An unreadable checkpoint spends nothing.
    }
  }
  return spent;
}

/**
 * The company to use: the one named (by ROC or new ROC), or else the first of
 * the wanted type that no build has put through a Pre-Application yet — a
 * ROC does not go through twice.
 */
export function pickTestCompany(opts: { wanted?: string; type?: SsmType } = {}): TestCompany {
  const list = loadTestCompanies();
  if (opts.wanted) {
    const hit = list.find((c) => c.roc === opts.wanted || c.newRoc === opts.wanted);
    if (!hit) throw new Error(`${opts.wanted} is not in ${TEST_COMPANIES_FILE}.`);
    return hit;
  }
  const spent = spentRocs();
  const fresh = list.filter((c) => (!opts.type || c.type === opts.type) && !spent.has(c.roc));
  if (!fresh.length) {
    throw new Error(
      `Every ${opts.type ?? ""} company in ${TEST_COMPANIES_FILE} has already been through a ` +
        "Pre-Application. Add more, or name one with ONB_COMPANY to reuse it deliberately.",
    );
  }
  return fresh[0];
}
