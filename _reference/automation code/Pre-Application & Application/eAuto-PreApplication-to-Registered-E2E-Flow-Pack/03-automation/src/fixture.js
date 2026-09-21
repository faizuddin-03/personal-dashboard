/**
 * Fixture identity + run checkpoints.
 *
 * Two jobs, both about not wasting a build:
 *
 * 1. A UNIQUE dealer per run, in the RIGHT FORMAT for its business type.
 *    E2E_TS1's first precondition is "clean dealer fixture — BRN not already
 *    onboarded", and a collision fails at the END of the form. So the company
 *    name, both ROC numbers, the licence number, the TIN and the e-mail all
 *    carry the same run stamp plus a persisted counter, and stay unique even for
 *    several fixtures generated inside the same minute.
 *
 *    Everything else — address, postcode, admin name — is deliberately dull and
 *    may repeat. Nothing in EAINT-11982 reads it.
 *
 *    THE COMPANY NAME CARRIES AN OWNER TAG — 'CHARMAIN' by default (Charmain,
 *    26-08-2026: every transaction this rig creates must be findable as hers in
 *    a listing shared with the rest of the team). It is the FIRST word of the
 *    name, so typing "charmain" into the listing's Company Name filter returns
 *    her rows and nothing else. Uniqueness is unchanged and independent of the
 *    tag: it comes from the run stamp plus the on-disk counter, and
 *    brandBusinessName() below enforces BOTH properties even when
 *    fixtures/profile.json or --overrides pins a name of its own.
 *
 * 2. A CHECKPOINT per run. The build is a chain of nine screens across three
 *    logins and two payment simulators; when it breaks at step seven the fixture
 *    is real and half-built. The checkpoint holds the application number, the
 *    uuid, the dealer link and which phases are done, so a rerun resumes instead
 *    of starting another dealer.
 *
 * WHAT THE PAGE ACTUALLY VALIDATES (captured 24-08-2026)
 *
 * Less than you would expect, so the formats below are for credibility rather
 * than to satisfy a checker:
 *   - New BRN / Old BRN / Business Trading License No: minimum 4 characters.
 *   - TIN: minimum 9 characters, maximum 15. No prefix or checksum rule.
 *   - Postcode: exactly 5 characters. Mobile No: maximum 11.
 *   - The company name is upper-cased by the page.
 *
 * The one real gate is on the SSM types: Next calls /obs/preOnb/checkSSM.do and
 * a BRN that is not a registered company sends the form to the Business Trading
 * path instead of advancing. No format fixes that — only a real BRN can.
 */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const DIR = path.resolve(__dirname, '..', 'fixtures');
const OVERRIDES = path.join(DIR, 'profile.json');
const SEQ = path.join(DIR, '.seq');

/** yymmdd-hhmm, the human-readable half of every generated value. */
function stampNow(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) +
    '-' + p(d.getHours()) + p(d.getMinutes())
  );
}

/**
 * A monotonic counter on disk.
 *
 * The stamp alone is only unique to the minute, and walking all five business
 * types in one pass generates five dealers inside the same minute. This is what
 * keeps their numbers apart.
 */
function nextSeq() {
  fs.mkdirSync(DIR, { recursive: true });
  let n = 0;
  try {
    n = parseInt(fs.readFileSync(SEQ, 'utf-8').trim(), 10) || 0;
  } catch {
    n = 0;
  }
  n = (n + 1) % 1000;
  fs.writeFileSync(SEQ, String(n));
  return String(n).padStart(3, '0');
}

/** A-Z check letter, derived from the digits so it is stable for a given number. */
const checkLetter = (digits) =>
  String.fromCharCode(65 + (String(digits).split('').reduce((a, c) => a + (+c || 0), 0) % 26));

/**
 * Identity numbers per business type, shaped like the registry each one comes
 * from — dummy, but not obviously junk to anyone reading the fixture:
 *
 *   SDN_BHD / BHD                    new: 12 digits (YYYY+01+6)  old: 6 digits + '-' + letter
 *   SOLE_PROPRIETORSHIP_PARTNERSHIP  new: 12 digits (YYYY+02+6)  old (ROB): 9 digits + '-' + letter
 *   LLP                              new: 12 digits (YYYY+03+6)  old: LLP + 7 digits + '-LGN'
 *   TRADING_SABAH                    trading licence: KK-<7 digits>
 *   TRADING_SARAWAK                  trading licence: KCH/<7 digits>
 *
 * The TIN prefix follows the taxpayer kind — C for companies and LLPs, D for
 * partnerships and sole proprietors — and the whole thing is 11 characters,
 * comfortably over the 9 the page demands and under its 15-character cap.
 */
function identityFor(typeCode, digits, seq) {
  const six = (digits + seq).slice(-6);
  const seven = (digits + seq).slice(-7);
  const nine = (digits + seq + seq).slice(-9);
  const year = '20' + digits.slice(0, 2);
  const tin = (prefix) => prefix + (digits + seq + '0').slice(-10);

  switch (typeCode) {
    case 'SDN_BHD':
      return { newBrn: year + '01' + six, oldBrn: six + '-' + checkLetter(six), licenceNo: '', tin: tin('C') };
    case 'SOLE_PROPRIETORSHIP_PARTNERSHIP':
      return { newBrn: year + '02' + six, oldBrn: nine + '-' + checkLetter(nine), licenceNo: '', tin: tin('D') };
    case 'LLP':
      return { newBrn: year + '03' + six, oldBrn: 'LLP' + seven + '-LGN', licenceNo: '', tin: tin('C') };
    case 'TRADING_SABAH':
      return { newBrn: '', oldBrn: '', licenceNo: 'KK/' + seven, tin: tin('C') };
    case 'TRADING_SARAWAK':
    default:
      return { newBrn: '', oldBrn: '', licenceNo: 'KCH/' + seven, tin: tin('C') };
  }
}

/** businessType radio value for a human-readable type label. */
function typeCodeOf(label) {
  const t = String(label || '').toLowerCase();
  if (/sarawak/.test(t)) return 'TRADING_SARAWAK';
  if (/sabah/.test(t)) return 'TRADING_SABAH';
  if (/llp/.test(t)) return 'LLP';
  if (/sole|partner/.test(t)) return 'SOLE_PROPRIETORSHIP_PARTNERSHIP';
  if (/sdn|bhd/.test(t)) return 'SDN_BHD';
  return 'TRADING_SARAWAK';
}

/**
 * Whose transactions these are. Charmain, 26-08-2026: "all trx must be unique
 * but must have the word charmain inside", so she can pick her own rows out of
 * a listing everyone else is also writing to.
 *
 * Upper case because the page upper-cases company names anyway, and the
 * listing's Company Name filter is not case-sensitive — searching "charmain"
 * finds these.
 */
const OWNER_TAG = (process.env.EV_OWNER_TAG || 'CHARMAIN').toUpperCase();

/**
 * Guarantee the two properties the company name has to have, whatever produced
 * it: it carries the OWNER_TAG, and it is unique to this run.
 *
 * This runs AFTER fixtures/profile.json and --overrides are merged on purpose.
 * A pinned businessName is a real use case — the SSM path needs a real
 * company's name against a real BRN — and before this, pinning one silently
 * dropped both the tag and the uniqueness the whole fixture design rests on.
 * Now a pinned name keeps its own words and gets the tag prefixed and the run
 * stamp appended if it is missing either.
 */
function brandBusinessName(name, stamp, seq, opts = {}) {
  let out = String(name || '').trim();
  const run = stamp + '-' + seq;
  if (!out.toUpperCase().includes(OWNER_TAG)) out = OWNER_TAG + ' ' + out;

  // SHARED COMPANY — opt-in, and the uniqueness suffix is deliberately withheld.
  //
  // Added 30-08-2026 for TS33, which needs TWO applications belonging to ONE dealer.
  // The run stamp is what normally guarantees uniqueness, so dropping it is a real
  // loss and it is confined: the OWNER_TAG is still applied, so the record is still
  // identifiable as ours, and every IDENTITY field still comes from
  // identityFor(code, digits, seq) and stays unique per record.
  //
  // Read the guard in scripts/build-fixture.js before using this — recovering an
  // application number by company name stops working the moment two records share one.
  if (opts.sharedCompany) return out.replace(/\s+/g, ' ').trim();

  if (!out.includes(run)) out = out + ' ' + run;
  return out.replace(/\s+/g, ' ').trim();
}

/** Company-name suffix that matches the type, so the fixture reads as plausible. */
const SUFFIX = {
  SDN_BHD: 'SDN BHD',
  SOLE_PROPRIETORSHIP_PARTNERSHIP: 'TRADING',
  LLP: 'PLT',
  TRADING_SABAH: 'ENTERPRISE',
  TRADING_SARAWAK: 'ENTERPRISE',
};

/** Every type the form offers, in the order the radios appear. */
const ALL_TYPES = [
  'Sdn Bhd / Bhd',
  'Sole Proprietorship / Partnership',
  'LLP',
  'Business Trading (Sabah)',
  'Business Trading (Sarawak)',
];

/**
 * A dealer that does not exist yet.
 *
 * The DEFAULT IS NON-SSM (Business Trading Sarawak) because a generated BRN
 * cannot satisfy checkSSM.do — see the header. Business type has no bearing on
 * the expiry date or on Extend, so the Non-SSM route costs the fixture nothing.
 * Pass --type "Sdn Bhd" with a REAL company's BRN in fixtures/profile.json when
 * the SSM path itself is what is under test.
 */
function newProfile(opts = {}) {
  // A company name shared with a sibling fixture — TS33 only. Read here rather than
  // deep in the branding helper so that "this run built a NON-UNIQUE record" is
  // visible at the top of the profile and lands in the checkpoint written to disk.
  const SHARED_COMPANY = String(opts.sharedCompany || process.env.EV_SHARED_COMPANY || '').trim();
  const stamp = opts.stamp || stampNow();
  const seq = opts.seq || nextSeq();
  const digits = stamp.replace(/\D/g, '');            // 10 digits, unique per minute
  const type = opts.type || 'Business Trading (Sarawak)';
  const code = typeCodeOf(type);
  const ssm = !/^TRADING_/.test(code);
  const id = identityFor(code, digits, seq);

  // Address is dummy and may repeat — nothing reads it. It only has to agree
  // with the business type, because picking the type auto-selects the state and
  // the state drives the city dropdown.
  const place = /SARAWAK/.test(code)
    ? { state: 'SARAWAK', city: 'KUCHING', postcode: '93100' }
    : /SABAH/.test(code)
      ? { state: 'SABAH', city: 'KOTA KINABALU', postcode: '88000' }
      : { state: 'WILAYAH PERSEKUTUAN KUALA LUMPUR', city: 'KUALA LUMPUR', postcode: '50450' };

  const profile = {
    stamp,
    seq,
    label: opts.label || 'fx-' + stamp + '-' + seq,

    // --- business identity: unique, and shaped like the real thing -----------
    // Tag first, then the ticket, then the run stamp, and only the type suffix
    // last: no maxlength was ever measured on #businessName, so the two parts
    // that MATTER — the owner tag and the run stamp — sit where a silent
    // truncation cannot reach them. "MOTORS" was dropped; SUFFIX already says
    // what kind of business it is.
    // SHARED_COMPANY wins outright: the point is that this record and its sibling
    // carry the SAME words, so neither the run stamp nor the type suffix may be added.
    businessName: SHARED_COMPANY || (OWNER_TAG + ' QA11982 ' + stamp + '-' + seq + ' ' + SUFFIX[code]),
    // Carried on the profile so the checkpoint on disk records it, and so
    // build-fixture.js can refuse the company-name lookup that this makes ambiguous.
    sharedCompany: SHARED_COMPANY || null,
    typeOfBusiness: type,
    typeCode: code,
    isSsm: ssm,
    newBrn: id.newBrn,
    oldBrn: id.oldBrn,
    tradingLicenseNo: id.licenceNo,
    tin: id.tin,
    // The Application Form's SST field is EXACTLY 15 characters when filled —
    // "SST Number must be 15 characters", enforced on Next. The TIN is 11, so
    // reusing it there stalls step one with a message that names neither field.
    sst: ('W' + digits + seq + '00').slice(0, 15),

    // --- showroom address: dummy, duplicates are fine ------------------------
    address: 'Lot 12, Jalan QA, Taman Automation',
    postcode: place.postcode,
    state: place.state,
    city: place.city,

    // --- admin in charge -----------------------------------------------------
    // No IC field exists on the form: Name, Mobile No (max 11), Email only. The
    // e-mail stays unique so every dealer has its own inbox.
    adminName: 'QA Admin ' + stamp,
    // The Application Form (not the pre-application one) also wants a DIRECTOR
    // and a PERSON IN CHARGE, each with a MyKad number. Two more blocks of
    // required fields on step one, and the reason a form that looked filled
    // would not advance.
    directorName: 'QA Director ' + stamp,
    directorMyKad: ('90' + digits + seq).slice(0, 12),
    directorMobile: ('012' + digits + seq).slice(0, 10),
    directorEmail: (process.env.EV_FIXTURE_EMAIL_PREFIX || 'qa.eaint11982') + '+dir' + stamp + '-' + seq + '@modefair.com',
    picName: 'QA PIC ' + stamp,
    picMyKad: ('91' + digits + seq).slice(0, 12),
    picMobile: ('013' + digits + seq).slice(0, 10),
    picEmail: (process.env.EV_FIXTURE_EMAIL_PREFIX || 'qa.eaint11982') + '+pic' + stamp + '-' + seq + '@modefair.com',
    adminEmail: (process.env.EV_FIXTURE_EMAIL_PREFIX || 'qa.eaint11982') + '+' + stamp + '-' + seq + '@modefair.com',
    adminPhone: ('01' + digits + seq).slice(0, 10),

    // --- what the build should end up with ------------------------------------
    ucdGroup: process.env.EV_UCD_GROUP || '',
    remark: process.env.EXTEND_REMARK || 'QA EAINT-11982 — automated fixture build',
  };

  const merged = Object.assign(profile, loadOverrides(), opts.overrides || {});
  merged.businessName = brandBusinessName(merged.businessName, merged.stamp, merged.seq,
    { sharedCompany: merged.sharedCompany });
  return merged;
}

/** fixtures/profile.json, if the operator has corrected the defaults. */
function loadOverrides() {
  try {
    return JSON.parse(fs.readFileSync(OVERRIDES, 'utf-8'));
  } catch {
    return {};
  }
}

const checkpointPath = (label) => path.join(DIR, label + '.json');

async function readCheckpoint(label) {
  try {
    return JSON.parse(await fsp.readFile(checkpointPath(label), 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Merge-write. Every phase writes as soon as it produces something durable — an
 * application number is worth more on disk than in a process that is about to
 * hit an unobserved screen.
 */
async function writeCheckpoint(label, patch) {
  await fsp.mkdir(DIR, { recursive: true });
  const now = Object.assign({ label, phases: {} }, (await readCheckpoint(label)) || {});
  const next = Object.assign(now, patch, {
    phases: Object.assign({}, now.phases, patch.phases || {}),
    updatedAt: new Date().toISOString(),
  });
  await fsp.writeFile(checkpointPath(label), JSON.stringify(next, null, 2));
  return next;
}

async function markPhase(label, phase, detail = {}) {
  return writeCheckpoint(label, { phases: { [phase]: Object.assign({ done: true, at: new Date().toISOString() }, detail) } });
}

const isDone = (cp, phase) => Boolean(cp && cp.phases && cp.phases[phase] && cp.phases[phase].done);

/** Newest checkpoint on disk — what `--resume` picks when given no label. */
async function latestLabel() {
  try {
    const files = (await fsp.readdir(DIR)).filter((f) => f.endsWith('.json') && f !== 'profile.json');
    const stats = await Promise.all(
      files.map(async (f) => ({ f, m: (await fsp.stat(path.join(DIR, f))).mtimeMs }))
    );
    stats.sort((a, b) => b.m - a.m);
    return stats.length ? path.basename(stats[0].f, '.json') : null;
  } catch {
    return null;
  }
}


/**
 * THE DEALER APPLICATION LINK FOR A RECORD THIS RIG BUILT.
 *
 * Added 29-08-2026, after TS16 spent NA68001112 on a take that filmed 16 of 17
 * and went MISSING on `dealer` — the one point the whole scenario is about.
 * The recorder looked for the link on the Pre-Application TAB with three
 * selectors and an href regex, found nothing, and told the operator to copy it
 * by hand from "Application Link > Copy Link".
 *
 * It never needed to. Every fixture the rig creates goes through the dealer
 * route, and build-fixture.js already writes the link it used into the
 * checkpoint:  fixtures/fx-<stamp>-<seq>.json { applicationNo, dealerLink }.
 * So for any record we built, the authoritative link is on disk.
 *
 * The shape, confirmed off two checkpoints and the page itself:
 *   https://<base>/obs/form/<linkUuid>?id=<branch%2Fseq>&s=<signature>
 * where <linkUuid> is the same value the application page carries in
 * #linkUuid — which is also the uuid the extend ENDPOINT keys on. The s
 * signature is NOT derivable from the page, which is exactly why reading the
 * markup could never have produced a working link and the checkpoint is the
 * only complete source.
 *
 * Returns null for a record we did not build. That is a property of the
 * FIXTURE, not a missing selector, and the caller should say so.
 */
/**
 * The checkpoint that holds a given application, found by APPLICATION NUMBER.
 *
 * Checkpoints are keyed by run LABEL, which is what a build knows and what a later
 * take does not: a take is handed EV_APP_NO and nothing else. dealerLinkFor() already
 * solved this for the dealer link, and E2E_TS4's two sittings need the same lookup for
 * a different field, so the search is factored out rather than copied.
 *
 * Newest first, same reason as dealerLinkFor: a record can appear in more than one
 * checkpoint if a build was resumed, and the latest run is the live one.
 */
function checkpointByAppNo(applicationNo) {
  const want = String(applicationNo == null ? "" : applicationNo).trim();
  if (!want) return null;
  let files = [];
  try {
    files = fs.readdirSync(DIR).filter((f) => /^fx-.*\.json$/.test(f));
  } catch {
    return null;
  }
  files.sort().reverse();
  for (const f of files) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
      if (String(j.applicationNo == null ? "" : j.applicationNo).trim() !== want) continue;
      return { label: j.label || f.replace(/\.json$/, ""), data: j, from: f };
    } catch {
      /* a half-written checkpoint is not an error here */
    }
  }
  return null;
}

/**
 * Merge a patch into the checkpoint that holds this application.
 *
 * Used by E2E_TS4 arm A to bank the expiry it patched, so arm B can say the job
 * expired the record on the EXTENDED date rather than the original one. Arm B reports
 * NOT DETERMINED without it and never guesses — an assertion that cannot fail is worse
 * than one that is absent.
 */
async function noteOnCheckpoint(applicationNo, patch) {
  const found = checkpointByAppNo(applicationNo);
  if (!found) return { ok: false, why: `no fixture checkpoint holds ${applicationNo}` };
  await writeCheckpoint(found.label, patch);
  return { ok: true, label: found.label };
}

function dealerLinkFor(applicationNo) {
  const want = String(applicationNo == null ? "" : applicationNo).trim();
  if (!want) return null;
  let files = [];
  try {
    files = fs.readdirSync(DIR).filter((f) => /^fx-.*\.json$/.test(f));
  } catch {
    return null;
  }
  // Newest first: a record can appear in more than one checkpoint if a build was
  // resumed, and the latest run is the one whose link was actually issued.
  files.sort().reverse();
  for (const f of files) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
      const got = String(j.applicationNo == null ? "" : j.applicationNo).trim();
      if (got !== want) continue;
      const link = String(j.dealerLink == null ? "" : j.dealerLink).trim();
      if (link) return { link, from: f };
    } catch {
      /* a half-written checkpoint is not an error here */
    }
  }
  return null;
}
module.exports = {
  DIR, OVERRIDES, SEQ, stampNow, nextSeq, newProfile, loadOverrides, identityFor, typeCodeOf,
  checkLetter, SUFFIX, ALL_TYPES, OWNER_TAG, brandBusinessName,
  checkpointPath, readCheckpoint, writeCheckpoint, markPhase, isDone, latestLabel, dealerLinkFor,
  checkpointByAppNo, noteOnCheckpoint,
};
