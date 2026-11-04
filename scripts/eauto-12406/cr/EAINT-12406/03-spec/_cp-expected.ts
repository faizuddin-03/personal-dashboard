// EAINT-12406 sheet CP (1 Secarang Pages): the expected texts, in the TS's words, shared by the CP specs.
// Source of every value: cr/EAINT-12406/01-intake/scenarios.yaml (approved 29.10.2026), which quotes SRD v1.1
// (26.10.2026) REQ-001, REQ-007, REQ-008, REQ-009 and the Secarang mockup 20261015 (SRD §1.5 #4).
// Not a spec (no `.spec.ts`): imported by 1-secarang-*.cr.spec.ts only.
import * as fs from "node:fs";
import * as path from "node:path";

export const LONPAC = "Lonpac Insurance Bhd";
export const ALLIANZ = "Allianz General Insurance Company (Malaysia) Berhad";
export const TOKIO = "Tokio Marine Insurans (Malaysia) Berhad";
/** REQ-001 / REQ-008 / REQ-009: the three insurers, in this order. */
export const INSURERS_IN_ORDER = [LONPAC, ALLIANZ, TOKIO];
/** Home logos (REQ-001 Ex.1a), named as the TS names them. */
export const HOME_LOGOS_IN_ORDER = ["Lonpac", "Allianz", "Tokio Marine"];

/** REQ-007: the new sentence (12406_CP_TS2 E1). */
export const PARTNERSHIP_SENTENCE =
  "Serba Sentral offers Allianz and collaborates with other insurance partners to offer products from Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad.";
/** Mockup 20261015: the whole Our partnership paragraph (12406_CP_TS2 E2). */
export const PARTNERSHIP_PARAGRAPH =
  "At SeCarang, Serba Sentral Sdn Bhd proudly presents offerings from various leading insurance providers. Additionally, to cater to diverse consumer needs, Serba Sentral offers Allianz and collaborates with other insurance partners to offer products from Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad.";
/** The old ending that must be gone (12406_CP_TS2 E3; BEFORE 12406_CP_TS8 E3). */
export const PARTNERSHIP_OLD_ENDING = "products from several key insurers, including Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad.";

/** REQ-009 c-d: Allianz's only contact line and the towing sentence (12406_CP_TS5). */
export const ALLIANZ_HELPLINE_LABEL = "24-Hours Helpline";
export const ALLIANZ_HELPLINE_NUMBER = "1800 22 5542";
export const ALLIANZ_TOWING =
  "You can request 24/7 towing and roadside assistance from Allianz by calling the toll-free Allianz Road Rangers Helpline at 1800-22-5542";
/** Labels the ticket named but the SRD superseded: must NOT be in the Allianz section (12406_CP_TS5 E1). */
export const NOT_ALLIANZ_LABELS = [/Road Assist(ance)? Hotline/i, /Customer Service/i];

/** The BEFORE half of 12406_CP_TS8, captured 28.10.2026 15:22 MYT on staging /ia/ (old build). */
export const BEFORE_DIR = path.resolve(__dirname, "..", "05-evidence", "pre-push", "12406_CP_TS8");

export interface BeforeTexts {
  homeLogos: { src: string; x: number; y: number }[];
  home: string;
  /** Step 2 of the BEFORE half: "cards" if All Quotations was reached, "popup" if a message answered instead. */
  quotation?: { state: string; text?: string; url?: string };
  aboutUs: string;
  faq: string;
  faqOpen: [string, string][];
  support: string;
  supportSections: { insurer: string; open: string; body: string }[];
}

/** The BEFORE page texts (12406_CP_TS8_page-texts-before.json). Throws when the BEFORE record is not there. */
export function beforeTexts(): BeforeTexts {
  const file = path.join(BEFORE_DIR, "12406_CP_TS8_page-texts-before.json");
  if (!fs.existsSync(file)) throw new Error(`The BEFORE record of 12406_CP_TS8 is missing: ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8")) as BeforeTexts;
}

/** Label of every copy of the 28.10 BEFORE capture kept in an AFTER run (Azfar 29.10.2026, proposed change C1). */
export const FROM_BEFORE = "FROM THE BEFORE CAPTURE";

/** The BEFORE record's screenshots whose name says they show All Quotations (none expected: E2 was never reached). */
export function beforeAllQuotationsShots(): string[] {
  return fs.readdirSync(BEFORE_DIR).filter((f) => /\.png$/i.test(f) && /quotations|insurance-card|choose-your-insurance/i.test(f));
}

/** A BEFORE screenshot by its file name; throws when missing. */
export function beforeShot(name: string): string {
  const file = path.join(BEFORE_DIR, name);
  if (!fs.existsSync(file)) throw new Error(`BEFORE screenshot missing: ${file}`);
  return file;
}

/**
 * The FAQ list style the BEFORE half recorded for "Which insurers can I get instant quotation from?"
 * (12406_CP_TS8_note.md, row E4: "Bulleted list: …"). Returns "bulleted" / "numbered"; throws when not recorded.
 */
export function beforeFaqListStyle(): "bulleted" | "numbered" {
  const file = path.join(BEFORE_DIR, "12406_CP_TS8_note.md");
  if (!fs.existsSync(file)) throw new Error(`The BEFORE note of 12406_CP_TS8 is missing: ${file}`);
  const m = fs.readFileSync(file, "utf8").match(/^\|\s*E4\s*\|[^\n]*?\|\s*(Bulleted|Numbered) list/im);
  if (!m) throw new Error(`${file} row E4 does not say "Bulleted list" or "Numbered list"`);
  return m[1].toLowerCase() as "bulleted" | "numbered";
}

/** Whitespace (incl. NBSP) collapsed and trimmed. */
export const clean = (s: string | null | undefined) => String(s ?? "").replace(/[\s ]+/g, " ").trim();
export const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Page text as lines, without the run's own overlays (the REC clock of the ts fixture, the screenshot banner). */
export function linesOf(bodyText: string): string[] {
  return bodyText
    .split(/\r?\n/)
    .map(clean)
    .filter((l) => l && !/^● REC \d/.test(l));
}

/**
 * What changed between two page texts, line by line (as multisets): lines only in `after` (added) and only in
 * `before` (removed), each with the allowed changes taken out. `unexpected*` is what is left.
 */
export function diffLines(before: string[], after: string[], allowed: { added: string[]; removed: string[] }) {
  const count = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
  const minus = (a: string[], b: string[]) => {
    const left = count(b);
    return a.filter((x) => {
      const n = left.get(x) ?? 0;
      if (n > 0) {
        left.set(x, n - 1);
        return false;
      }
      return true;
    });
  };
  const added = minus(after, before);
  const removed = minus(before, after);
  return {
    added,
    removed,
    unexpectedAdded: minus(added, allowed.added),
    unexpectedRemoved: minus(removed, allowed.removed),
    allowedSeen: { added: allowed.added.filter((x) => added.includes(x)), removed: allowed.removed.filter((x) => removed.includes(x)) },
  };
}
