/**
 * Seed one company into eSim's SSM simulator — both rows, matched.
 *
 * The callable half of `scripts/seed-ssm.ts`, so a build can seed its own
 * company instead of needing a manual step first.
 *
 * ── Why it clones instead of generating ────────────────────────────────────
 * A ROC document is six XML fragments across six columns, and only two of them
 * (the directors and the shareholders) have anything to do with the test. The
 * other four are company profile, share capital, charges and financials —
 * long, structured, and irrelevant to every onboarding scenario. So a REAL
 * record is the donor, the people columns are replaced and the rest is kept
 * verbatim. A malformed invented block fails inside the parser, where the
 * error says nothing useful. Exception (21.10.2026): a ROC's page1 carries the
 * company's NAME / REF_NO / NEW_REF_NO, which eAuto compares with Step 1 once
 * the SSM Document is bought, so those are rewritten to the seeded company
 * (`rocPage1For`). ROB `businessInfo` and LLP `basicProfile` are still the
 * donor's: fix them the same way before using those seeds for a purchase.
 *
 * ── Both rows, or neither ──────────────────────────────────────────────────
 * `roc` and `newRoc` are the join between the enquiry and the document. If
 * the document row fails, the enquiry row is DELETED again: a company that is
 * findable but unreadable fails later at a screen that cannot explain why.
 */
import type { EsimClient, EsimRecord } from "@fixtures/esim";
import {
  SSM_ENQUIRY_ENTITY,
  SSM_SUBMISSION_ENTITY,
  SSM_ITEM_TYPE,
  SSM_OK,
  SAMPLE_IC,
  countedOwners,
  rocDirectorsXml,
  rocShareholdersXml,
  robOwnersXml,
  llpInvolvementsXml,
  esc,
  type OwnerConfig,
  type SsmType,
} from "@data/ssm";

type Row = EsimRecord & Record<string, unknown>;

export interface SeedOptions {
  type: SsmType;
  directors?: number;
  /** ROC: SECRETARY. LLP: a `CO` involvement. Both seeded and NOT counted. */
  secretaries?: number;
  /** ROC: shareholders. ROB: PREVIOUS_OWNER. Both seeded and NOT counted. */
  shareholders?: number;
  /** How many of the directors carry a passport rather than a MyKad. */
  foreign?: number;
  companyName?: string;
  /**
   * A REAL company's numbers, from the test-company list. Needed since
   * 2026-09-23: the TIN check passes only when ROC, new ROC and TIN are a
   * real, matching trio, so generated numbers can no longer get through it.
   * Omit both to generate an unused `QA…` pair as before.
   */
  roc?: string;
  newRoc?: string;
  /**
   * The exact people to seed, instead of generated ones — e.g. an STMS company
   * seller whose director must match the Step 1 representative's MyKad.
   * ROC ICs are dashed (######-##-####).
   */
  owners?: OwnerConfig[];
}

export interface SeededCompany {
  type: SsmType;
  roc: string;
  newRoc: string;
  companyName: string;
  /** What the Application's director rows should number. */
  expectedDirectors: number;
  /** The first counted director's IC — what the Main User auto-fill shows. */
  firstDirectorIc: string;
}

/**
 * Every row this suite writes carries this in `remark`. It is how a row is
 * known to be OURS — to update in place, or to delete after a half-write —
 * now that real ROCs no longer carry the `QA` prefix generated ones did.
 */
export const SEED_REMARK = "Azfar - QA automation";

export const isSeededByUs = (row: EsimRecord): boolean => String(row.remark ?? "").startsWith(SEED_REMARK);

/** The column that carries people, per type — a donor must have it populated. */
const PEOPLE_COLUMN: Record<SsmType, string> = { ROB: "currentOwnerInfo", ROC: "page3", LLP: "involvements" };
const SUFFIX: Record<SsmType, string> = { ROB: "ENTERPRISE", ROC: "SDN BHD", LLP: "PLT" };

/**
 * Company numbers whose SSM Document eAuto has already BOUGHT and stored with a mismatching page1, so a new STMS on
 * them within the document's 7-day validity reuses that stored document and fails the EAINT-10119 verification again
 * (LKM board SSMREFNO_ROC_TS12), whatever eSim says now. Never seeded again, even after their eSim rows are removed.
 * QA456528 / 202600456528: bought 21.10.2026 on staging /uat1/ (run EAINT-12253-verify-stms-company-ssm-r4, ON000170;
 * cr/EAINT-12253/05-evidence/triage-2026-10-21-ssm.md), document valid until 27.10.2026.
 */
export const SPENT_SSM_KEYS: ReadonlySet<string> = new Set(["QA456528", "202600456528"]);

/**
 * A ROC number nothing else uses, on both sides.
 *
 * Two chains on one BRN overwrite each other's directors and both then test
 * the wrong thing.
 */
function uniqueKeys(taken: Set<string>): { roc: string; newRoc: string } {
  for (let attempt = 0; attempt < 500; attempt++) {
    const n = Math.floor(100000 + Math.random() * 899999);
    const roc = `QA${n}`;
    const newRoc = `2026${String(n).padStart(8, "0")}`;
    if (!taken.has(roc) && !taken.has(newRoc) && !SPENT_SSM_KEYS.has(roc) && !SPENT_SSM_KEYS.has(newRoc)) return { roc, newRoc };
  }
  throw new Error("Could not find an unused ROC after 500 tries.");
}

/**
 * Replace the text of the FIRST `<tag>` element of a fragment (`<tag>…</tag>` or `<tag/>`). Throws when the tag is not
 * there: a document left with the donor's value is the silent mismatch this exists to prevent.
 */
function setTag(xml: string, tag: string, value: string): string {
  const re = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>|<${tag}\\s*/>`);
  if (!re.test(xml)) throw new Error(`The donor's SSM document has no <${tag}> to rewrite; not seeding a document that names another company.`);
  return xml.replace(re, `<${tag}>${esc(value)}</${tag}>`);
}

/**
 * ROC `page1` (the company profile) of the donor, rewritten to name the seeded company. page1 is what eAuto reads from
 * the bought SSM Document and compares with Step 1 (EAINT-10119 SRD V1.2 §2.2.2: company name, old and new registration
 * number); the enquiry/submission `roc` / `newRoc` / `companyName` columns are only the simulator's lookup keys. The
 * team's recipe (cr/EAINT-12022/00-input/miro-lkm-board.md, frame "Puchase SSM for ROC", ~line 570): enquiry Roc = old
 * number WITHOUT "-A", New Roc = new number; page1 `<REF_NO>{Roc}-A</REF_NO>`, `<NEW_REF_NO>{New Roc}</NEW_REF_NO>`,
 * `<ROC_STATUS>EXISTING</ROC_STATUS>`; page1 `<NAME>` is the name compared (SSMCOMPNAME_SC_TS2/6). "-A" is eSim's default
 * check digit (`checkDigit` null), the one the Purchase SSM pop-up shows ("QA456528-A"). A roc that already carries its
 * check letter ("597436-Q") is used as it is.
 * Added 21.10.2026 (EAINT-12253 triage): before it, every seeded ROC's document was the donor's SUPER MOTORS SDN. BHD.,
 * 999999-A, so a bought document failed "Business Registration Number does not match the SSM document".
 */
function rocPage1For(donorPage1: unknown, companyName: string, roc: string, newRoc: string): string {
  const refNo = /-[A-Z]$/i.test(roc) ? roc : `${roc}-A`;
  let page1 = String(donorPage1 ?? "");
  page1 = setTag(page1, "NAME", companyName);
  page1 = setTag(page1, "OLDNAME", "");
  page1 = setTag(page1, "REF_NO", refNo);
  page1 = setTag(page1, "NEW_REF_NO", newRoc);
  page1 = setTag(page1, "ROC_STATUS", "EXISTING");
  return page1;
}

/** The people to seed, from the counts. */
function buildOwners(directors: number, secretaries: number, foreign: number): OwnerConfig[] {
  const out: OwnerConfig[] = [];
  for (let i = 0; i < directors; i++) {
    out.push({
      name: `QA DIRECTOR ${String.fromCharCode(65 + i)}`,
      // A passport is what makes the system read a director as foreign —
      // there is no nationality field.
      ic:
        i < foreign
          ? `${SAMPLE_IC.foreignA.slice(0, 2)}${String(1000000 + i).slice(-7)}`
          : `${690501 + i}-13-${7631 + i}`,
      designation: "DIRECTOR",
    });
  }
  for (let i = 0; i < secretaries; i++) {
    out.push({ name: `QA SECRETARY ${String.fromCharCode(65 + i)}`, ic: `${700101 + i}-13-${1000 + i}`, designation: "SECRETARY" });
  }
  return out;
}

/**
 * The same people, shaped for the type. The IC FORMAT differs per type and
 * decides nationality: ROC is dashed, ROB and LLP are twelve plain digits.
 */
function shapeForType(type: SsmType, people: OwnerConfig[]): OwnerConfig[] {
  return people.map((o) => {
    const plain = o.ic.replace(/-/g, "");
    if (type === "ROC") return o;
    if (type === "ROB") return { name: o.name, ic: plain };
    return { name: o.name, ic: plain, involveType: o.designation === "SECRETARY" ? ("CO" as const) : ("PT" as const) };
  });
}

export async function seedSsmCompany(sim: EsimClient, opts: SeedOptions): Promise<SeededCompany> {
  const { type } = opts;
  const directors = opts.directors ?? 2;
  const secretaries = opts.secretaries ?? 0;
  const shareholderCount = opts.shareholders ?? 0;
  const foreign = opts.foreign ?? 0;

  if (!SSM_SUBMISSION_ENTITY[type]) throw new Error(`Type ${type} is not ROB, ROC or LLP.`);
  // ROB has no secretary — every CURRENT_OWNER counts — so a "secretary" would
  // silently become an extra owner and inflate the count the test asserts.
  if (type === "ROB" && secretaries > 0) {
    throw new Error("secretaries has no meaning for ROB — use shareholders, which seeds PREVIOUS_OWNER.");
  }

  const enquiry = (await sim.list(SSM_ENQUIRY_ENTITY)) as Row[];
  const submissions = (await sim.list(SSM_SUBMISSION_ENTITY[type])) as Row[];

  // Some rows are stubs; cloning one produces a company with nobody in it.
  const donor = submissions.find((r) => String(r[PEOPLE_COLUMN[type]] ?? "").trim().length > 50);
  if (!donor) throw new Error(`No ${SSM_SUBMISSION_ENTITY[type]} row has a populated "${PEOPLE_COLUMN[type]}" to clone.`);

  let roc: string;
  let newRoc: string;
  if (opts.roc || opts.newRoc) {
    if (!opts.roc || !opts.newRoc) throw new Error("A real company needs BOTH roc and newRoc.");
    ({ roc, newRoc } = { roc: opts.roc, newRoc: opts.newRoc });
    if (SPENT_SSM_KEYS.has(roc) || SPENT_SSM_KEYS.has(newRoc)) {
      throw new Error(`${roc} / ${newRoc} already has a bought, mismatching SSM Document stored in eAuto (SPENT_SSM_KEYS); seed a new company.`);
    }
  } else {
    const taken = new Set([...enquiry, ...submissions].flatMap((r) => [String(r.roc), String(r.newRoc)]));
    ({ roc, newRoc } = uniqueKeys(taken));
  }
  const companyName = opts.companyName ?? `QA AUTOMATION ${roc} ${SUFFIX[type]}`;

  // A real ROC may already be configured. Ours → update in place. Anyone
  // else's → stop: a shared simulator's rows are other people's fixtures.
  const matching = (rows: Row[]) => rows.filter((r) => String(r.roc) === roc || String(r.newRoc) === newRoc);
  const existing = [...matching(enquiry), ...matching(submissions)];
  const othersRows = existing.filter((r) => !isSeededByUs(r));
  if (othersRows.length) {
    throw new Error(
      `${roc} / ${newRoc} is already configured in eSim by someone else ` +
        `(remark "${othersRows[0].remark ?? ""}", id ${othersRows[0].id}). Not overwriting it — pick another company.`,
    );
  }
  const ourEnquiry = matching(enquiry)[0];
  const ourSubmission = matching(submissions)[0];

  const owners = shapeForType(type, opts.owners ?? buildOwners(directors, secretaries, foreign));
  const shareholders: OwnerConfig[] = Array.from({ length: shareholderCount }, (_, i) => ({
    name: `QA SHAREHOLDER ${String.fromCharCode(65 + i)}`,
    ic: `${800101 + i}-13-${2000 + i}`,
  }));

  const remark = `${SEED_REMARK} ${type}`;
  const common = { roc, newRoc, companyName, remark, delayMiliSeconds: 0, checkDigit: null };
  const enquiryRow: Row = { ...common, responseCode: SSM_OK.enquiry, itemType: SSM_ITEM_TYPE[type] };

  const document: Row =
    type === "ROC"
      ? {
          // page1 = the company profile eAuto compares with Step 1: rewritten to THIS company (rocPage1For).
          page1: rocPage1For(donor.page1, companyName, roc, newRoc),
          page2: donor.page2,
          page3: rocDirectorsXml(owners),
          page4: rocShareholdersXml(shareholders),
          page5: donor.page5,
          page6: donor.page6,
        }
      : type === "ROB"
        ? {
            businessInfo: donor.businessInfo,
            currentOwnerInfo: robOwnersXml(owners, "CURRENT_OWNER"),
            previousOwnerInfo: shareholders.length ? robOwnersXml(shareholders, "PREVIOUS_OWNER") : "",
          }
        : {
            basicProfile: donor.basicProfile,
            regOfficeAdd: donor.regOfficeAdd,
            regBizAddresses: donor.regBizAddresses,
            bizCodes: donor.bizCodes,
            involvements: llpInvolvementsXml(owners),
          };

  const submissionRow: Row = { ...common, ...document, responseCode: SSM_OK.submission, backupLink: donor.backupLink };

  if (ourEnquiry || ourSubmission) {
    // Re-seeding one of OUR rows: update both halves in place.
    await (ourEnquiry
      ? sim.update(SSM_ENQUIRY_ENTITY, { ...ourEnquiry, ...enquiryRow, id: ourEnquiry.id! })
      : sim.create(SSM_ENQUIRY_ENTITY, enquiryRow));
    await (ourSubmission
      ? sim.update(SSM_SUBMISSION_ENTITY[type], { ...ourSubmission, ...submissionRow, id: ourSubmission.id! })
      : sim.create(SSM_SUBMISSION_ENTITY[type], submissionRow));
  } else {
    const writtenEnquiry = await sim.create(SSM_ENQUIRY_ENTITY, enquiryRow);
    try {
      await sim.create(SSM_SUBMISSION_ENTITY[type], submissionRow);
    } catch (err) {
      await sim.removeSeeded(SSM_ENQUIRY_ENTITY, writtenEnquiry).catch(() => undefined);
      throw new Error(`The document row failed, so the enquiry row was removed again: ${(err as Error).message}`);
    }
  }

  const counted = countedOwners(type, owners);
  return {
    type,
    roc,
    newRoc,
    companyName,
    expectedDirectors: counted.length,
    firstDirectorIc: counted[0]?.ic.replace(/-/g, "") ?? "",
  };
}

/**
 * A new ROC company whose only director is `rep`: an STMS Company seller, whose Step 1 representative must be a
 * director in the SSM document (EAINT-10119: the name typed on Step 1 must equal the SSM name, so use the returned
 * `companyName` / `newRoc` there). Added 21.10.2026 for EAINT-12253 (CH_TS1, BEH_TS7: "a new eSim SSM company with the
 * simulator MyKad holder as director"). Writes only rows carrying SEED_REMARK.
 * ALWAYS a NEW company: no roc is passed, so `uniqueKeys` picks a number no eSim row uses and that is not in
 * SPENT_SSM_KEYS (QA456528 / 202600456528 has a bought, mismatching SSM Document stored until 27.10.2026). Never pass a
 * fixed or earlier company here: a document bought within 7 days is reused by eAuto whatever eSim says now.
 */
export async function seedStmsCompanySeller(sim: EsimClient, rep: { NRIC: string; GMPCName: string }): Promise<SeededCompany> {
  const n = rep.NRIC.replace(/-/g, "");
  return seedSsmCompany(sim, { type: "ROC", owners: [{ name: rep.GMPCName, ic: `${n.slice(0, 6)}-${n.slice(6, 8)}-${n.slice(8)}`, designation: "DIRECTOR" }] });
}
