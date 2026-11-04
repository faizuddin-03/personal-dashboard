/**
 * The SSM document, and how eSim stores it.
 *
 * Director data is never typed into a form. The system buys an SSM document
 * from the BRN, parses it, and prepopulates the Application from what it
 * finds. So seeding the SSM response IS how a test chooses its directors.
 *
 * ── TWO records per company, and they must agree ───────────────────────────
 * eSim splits this across two entities, and a company needs a row in BOTH:
 *
 *   ssm-enquiry-resp             the lookup — does this BRN exist, what is it
 *   ssm-<type>-submission-resp   the document itself, with the people in it
 *
 * `roc` and `newRoc` are the join, and they must match on both sides. A row on
 * one side only produces a company the system can find but not read, or read
 * but not find. Verified against staging 2026-09-22: 47 of 65 ROC submission
 * rows have a matching enquiry row.
 *
 * ── The three shapes share NOTHING ─────────────────────────────────────────
 * Not a shared schema, not a shared column set, not even a shared idea of what
 * a "page" is. Read off staging 2026-09-22:
 *
 * | Type | Entity                      | Columns holding the document                                    |
 * |------|-----------------------------|------------------------------------------------------------------|
 * | ROB  | ssm-rob-submission-resp     | businessInfo · currentOwnerInfo · previousOwnerInfo               |
 * | ROC  | ssm-roc-submission-resp     | page1 … page6  (page3 = DIRECTORS, page4 = SHAREHOLDERS)          |
 * | LLP  | ssm-llp-submission-resp     | basicProfile · regOfficeAdd · regBizAddresses · bizCodes · involvements |
 *
 * The brief's §3 table describes the PARSED structure. This describes the
 * STORED structure, and they are not the same thing — the brief says ROC
 * directors live in `DIRECTORS > DIRECTOR`, which is true, but that block is
 * inside `page3` rather than in a column of its own.
 *
 * ── Who gets counted ───────────────────────────────────────────────────────
 * Each shape excludes something, and the exclusion is the point of several
 * scenarios:
 *
 *   ROB   all CURRENT_OWNER          excludes PREVIOUS_OWNER
 *   ROC   DESIGNATION = DIRECTOR     excludes SECRETARY, and all SHAREHOLDERS
 *   LLP   involveType = PT           excludes CO
 *
 * ── The IC format is load-bearing ──────────────────────────────────────────
 * **Nationality is derived from the IC, not from a field.** Twelve digits
 * reads as Malaysian; anything else reads as foreign. Formats differ per type
 * and must NOT be normalised — ROC's is dashed, the other two are not.
 *
 * ⚠ A foreign director does NOT render in the SSM Details display. Confirmed
 * with dev per the brief. They are still counted. Never wait on one appearing.
 */

export type SsmType = "ROB" | "ROC" | "LLP";

/** The eSim entity holding each type's document. */
export const SSM_SUBMISSION_ENTITY: Record<SsmType, string> = {
  ROB: "ssm-rob-submission-resp",
  ROC: "ssm-roc-submission-resp",
  LLP: "ssm-llp-submission-resp",
};

/** The lookup every type shares. */
export const SSM_ENQUIRY_ENTITY = "ssm-enquiry-resp";

/**
 * `itemType` on the enquiry row, which is how the enquiry says which document
 * to fetch. Azfar, 2026-09-22.
 */
export const SSM_ITEM_TYPE: Record<SsmType, string> = { ROB: "B", ROC: "C", LLP: "L" };

/** Which SSM shape a business type uses. */
export const SSM_TYPE_FOR: Record<string, SsmType> = {
  "Sole Proprietorship": "ROB",
  Partnership: "ROB",
  "Sdn Bhd": "ROC",
  Bhd: "ROC",
  LLP: "LLP",
};

/**
 * The response codes a working pair uses.
 *
 * Read off staging 2026-09-22: the enquiry side is `004` on 108 of 115 rows,
 * and every one of the 47 matched pairs has submission `005`. What the other
 * codes mean is NOT established — `003`, `001` on enquiry and `009` on
 * submission exist and nothing here says what they do.
 */
export const SSM_OK = { enquiry: "004", submission: "005" } as const;

export interface OwnerConfig {
  name: string;
  /** 12 digits = Malaysian. Anything else (a passport) = foreign. */
  ic: string;
  /** ROC only. A SECRETARY is seeded and must NOT be counted. */
  designation?: "DIRECTOR" | "SECRETARY";
  /** LLP only. `CO` is seeded and must NOT be counted. */
  involveType?: "PT" | "CO";
}

/** True when this IC reads as Malaysian — twelve digits, dashes ignored. */
export function isMalaysian(ic: string): boolean {
  return /^\d{12}$/.test(ic.replace(/-/g, ""));
}

/**
 * How many people the system should count from a seeded set.
 *
 * This is the number the Application prepopulates, and therefore the number a
 * test asserts. It is NOT `owners.length` — every shape excludes something.
 */
export function countedOwners(type: SsmType, owners: OwnerConfig[]): OwnerConfig[] {
  switch (type) {
    case "ROB":
      return owners;
    case "ROC":
      return owners.filter((o) => (o.designation ?? "DIRECTOR") === "DIRECTOR");
    case "LLP":
      return owners.filter((o) => (o.involveType ?? "PT") === "PT");
  }
}

/** A real newline, kept as a constant so no build step can eat the escape. */
const NEWLINE = String.fromCharCode(10);

export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * ROC `page3` — the DIRECTORS block.
 *
 * Element names and the `ID` attribute are copied from a live record
 * (`ssm-roc-submission-resp`, staging 2026-09-22). The address fields are
 * filler: nothing in the onboarding scenarios asserts on a director's address,
 * and inventing a realistic one would suggest it mattered.
 */
export function rocDirectorsXml(owners: OwnerConfig[]): string {
  const one = (o: OwnerConfig, i: number): string =>
    [
      `    <DIRECTOR ID='${i + 1}'>`,
      `        <NAME>${esc(o.name)}</NAME>`,
      `        <ADDRESS1>NO. ${i + 1}, JALAN QA</ADDRESS1>`,
      `        <ADDRESS2>TAMAN AUTOMATION</ADDRESS2>`,
      `        <ADDRESS3> MALAYSIA</ADDRESS3>`,
      `        <POSTCODE>50000</POSTCODE>`,
      `        <TOWN>KUALA LUMPUR</TOWN>`,
      `        <STATE>WILAYAH PERSEKUTUAN</STATE>`,
      `        <IC>${esc(o.ic)}</IC>`,
      `        <DESIGNATION>${o.designation ?? "DIRECTOR"}</DESIGNATION>`,
      `        <STARTDATE>1-1-2020</STARTDATE>`,
      `    </DIRECTOR>`,
    ].join("\n");
  return ["<DIRECTORS>", ...owners.map(one), "</DIRECTORS>"].join("\n");
}

/**
 * ROC `page4` — the SHAREHOLDERS block.
 *
 * Seeded so the exclusion has something to exclude: scenario `12341_E2E8` is
 * 2 directors plus 3 shareholders and expects a count of 2. A test that seeds
 * no shareholders never exercises the rule at all.
 *
 * `ENTITY` is `MK` for a MyKad holder and `P` for a passport on the live
 * records — derived from the IC, same rule as everything else here.
 */
export function rocShareholdersXml(shareholders: OwnerConfig[]): string {
  const one = (s: OwnerConfig, i: number): string =>
    [
      `    <SHAREHOLDER ID='${i + 1}'>`,
      `        <ENTITY>${isMalaysian(s.ic) ? "MK" : "P"}</ENTITY>`,
      `        <IC>${esc(s.ic)}</IC>`,
      `        <NAME>${esc(s.name)}</NAME>`,
      `        <SHARE>10000</SHARE>`,
      `    </SHAREHOLDER>`,
    ].join("\n");
  return ["<SHAREHOLDERS>", ...shareholders.map(one), "</SHAREHOLDERS>"].join("\n");
}

/**
 * LLP `involvements` — `PT` counts, `CO` does not.
 *
 * Element names copied verbatim from a live record, 2026-09-22, including the
 * nested `<address>` block. An earlier version emitted four elements; the real
 * one has thirteen plus the address. Lowercase names are the record's own, and
 * an XML parser is case-sensitive.
 */
export function llpInvolvementsXml(owners: OwnerConfig[], entityNo = "LLP0000000-LGN"): string {
  const one = (o: OwnerConfig, i: number): string => {
    const type = o.involveType ?? "PT";
    return [
      `            <involvement id='${i}'>`,
      `                <involveType>${type}</involveType>`,
      `                <involveTypeDesc>${type === "PT" ? "PARTNER" : "COMPLIANCE OFFICER"}</involveTypeDesc>`,
      `                <involveName>${esc(o.name)}</involveName>`,
      `                <involveIdType>01</involveIdType>`,
      `                <involveIdTypeDesc>${isMalaysian(o.ic) ? "NRIC" : "PASSPORT"}</involveIdTypeDesc>`,
      `                <involveId>${esc(o.ic)}</involveId>`,
      `                <involveEffectiveFromDt>2020-01-01T00:00:00.000Z</involveEffectiveFromDt>`,
      `                <involveEffectiveToDt></involveEffectiveToDt>`,
      `                <entityNo>${esc(entityNo)}</entityNo>`,
      `                <entityName></entityName>`,
      `                <entityNoNewFormat></entityNoNewFormat>`,
      `                <entityStatus></entityStatus>`,
      `                <entityStatusDesc></entityStatusDesc>`,
      `                <address>`,
      `                    <address1>NO. ${i + 1}, JALAN QA AUTOMATION</address1>`,
      `                    <address2>TAMAN AUTOMATION</address2>`,
      `                    <address3></address3>`,
      `                    <postcode>50000</postcode>`,
      `                    <city>KUALA LUMPUR</city>`,
      `                    <state>W</state>`,
      `                    <stateDesc>WILAYAH PERSEKUTUAN</stateDesc>`,
      `                    <country>MYS</country>`,
      `                    <countryDesc></countryDesc>`,
      `                    <principalInd></principalInd>`,
      `                    <principalIndDesc></principalIndDesc>`,
      `                </address>`,
      `            </involvement>`,
    ].join(NEWLINE);
  };
  // BARE <involvement> elements, no wrapper: 8 of the 9 real LLP rows in eSim
  // are stored that way (checked 2026-09-23). A seed wrapped in <INVOLVEMENTS>
  // — the shape of the ninth — resolved on the Pre-Application but rendered
  // ONE unnamed row on the Application, the no-document layout, for a seeded
  // two-partner LLP.
  return owners.map(one).join(NEWLINE);
}

/**
 * ROB `currentOwnerInfo` / `previousOwnerInfo`.
 *
 * Element names copied verbatim from a live record, 2026-09-22. An earlier
 * version of this guessed a four-element block; the real one has sixteen,
 * including a `<NATIONALITY>` the brief explicitly warns is NOT what drives the
 * nationality rule — the IC format is. It is emitted for realism and nothing
 * reads it.
 *
 * `previousOwnerInfo` takes the same block under a different tag, and is what
 * the ROB exclusion rule exists to ignore.
 */
export function robOwnersXml(
  owners: OwnerConfig[],
  tag: "CURRENT_OWNER" | "PREVIOUS_OWNER" = "CURRENT_OWNER",
): string {
  return owners
    .map((o, i) =>
      [
        `<${tag} ID='${i + 1}'>`,
        `    <NAME>${esc(o.name)}</NAME>`,
        `    <RESIDENTIAL_ADDRESS>NO. ${i + 1}, JALAN QA AUTOMATION</RESIDENTIAL_ADDRESS>`,
        `    <RESIDENTIAL_ADDRESS1>N/A</RESIDENTIAL_ADDRESS1>`,
        `    <RESIDENTIAL_ADDRESS2>N/A</RESIDENTIAL_ADDRESS2>`,
        `    <RESIDENTIAL_POSTCODE>50000</RESIDENTIAL_POSTCODE>`,
        `    <RESIDENTIAL_TOWN>KUALA LUMPUR</RESIDENTIAL_TOWN>`,
        `    <RESIDENTIAL_STATE>WILAYAH PERSEKUTUAN</RESIDENTIAL_STATE>`,
        `    <COLOR_TYPE>BLUE</COLOR_TYPE>`,
        `    <IC_OLD>N/A</IC_OLD>`,
        `    <IC_NEW>${esc(o.ic)}</IC_NEW>`,
        `    <DATE_OF_BIRTH>05-01-1979</DATE_OF_BIRTH>`,
        `    <RACE>N/A</RACE>`,
        `    <GENDER>MALE</GENDER>`,
        // Emitted for realism only. The IC format is what decides nationality.
        `    <NATIONALITY>${isMalaysian(o.ic) ? "MALAYSIAN CITIZEN" : "NON CITIZEN"}</NATIONALITY>`,
        `    <DATE_JOIN>18-06-2000</DATE_JOIN>`,
        `</${tag}>`,
      ].join(NEWLINE),
    )
    .join(NEWLINE);
}

/**
 * Sample ICs from the brief, so a test can ask for a nationality without
 * inventing a number that might not parse the way it expects.
 */
export const SAMPLE_IC = {
  malaysianRob: "990621015447",
  malaysianRoc: "690501-13-7631",
  malaysianLlp: "940411105991",
  foreignA: "RA0009999",
  foreignB: "E931789877",
} as const;
