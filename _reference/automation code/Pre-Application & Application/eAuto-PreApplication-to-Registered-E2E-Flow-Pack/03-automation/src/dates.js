/**
 * Date arithmetic for the extend window. One implementation, imported by every
 * spec and script, because the two ends of the window count in DIFFERENT units
 * and mixing them up is a two-day error nobody would spot in a run log.
 *
 * The window, as confirmed by the BA through Charmain on 26-08-2026:
 *
 *   initial expiry   = application created date + 90 DAYS
 *   button appears   = initial expiry - 30 DAYS
 *   button disappears = initial expiry + 3 CALENDAR MONTHS
 *
 * Note "initial": the window is anchored to the application's FIRST expiry
 * date, not to the new one an extension produces.
 *
 * **Calendar months, not 90 days.** QA tested to 90 days for two days on the
 * strength of a verbal answer; the written answer is three calendar months, and
 * they are not the same number. Worked from the same expiry date:
 *
 *   30 Nov 2026 + 3 months = 28 Feb 2027   -> 90 days
 *   31 Dec 2026 + 3 months = 31 Mar 2027   -> 90 days
 *   31 May 2026 + 3 months = 31 Aug 2026   -> 92 days
 *   28 Feb 2027 + 3 months = 28 May 2027   -> 89 days
 *
 * So a 90-day cutoff misclassifies records by up to two days either way, which
 * is exactly the size of the boundary this feature is tested on.
 *
 * **Month-end clamping** follows timeanddate.com's Add-Days calculator, which is
 * the reference Charmain supplied: 31 Jan 2026 + 3 months = 30 Apr 2026, because
 * 31 April does not exist. Every calendar-month implementation has to choose
 * here, and this is the one the requirement means.
 */

/** Days in a month, 1-indexed month. */
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Add whole calendar months, clamping to the last day of the target month.
 * Works on a Date and returns a Date at the same local midnight.
 *
 *   addCalendarMonths(new Date(2026, 0, 31), 3) -> 30 Apr 2026
 *   addCalendarMonths(new Date(2026, 4, 31), 3) -> 31 Aug 2026
 */
function addCalendarMonths(date, months) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1 + months; // 1-indexed, may overflow
  const targetYear = y + Math.floor((m - 1) / 12);
  const targetMonth = ((m - 1) % 12 + 12) % 12 + 1;
  const day = Math.min(date.getDate(), daysInMonth(targetYear, targetMonth));
  return new Date(targetYear, targetMonth - 1, day);
}

/** Add whole days. */
function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Whole days between two dates, counting DATES not milliseconds — Q4: the time
 * of day is ignored, even though the listing renders expiry to the minute.
 */
function daysBetween(from, to) {
  return Math.round(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86_400_000,
  );
}

/** "2026-11-22 21:10" (or just the date part) -> Date at local midnight, or null. */
function parseListingDate(raw) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw || '').trim());
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}

/** Local midnight today, so every comparison is date-to-date. */
function today() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

const BEFORE_DAYS = 30;
const AFTER_MONTHS = 3;

/**
 * Where a record sits relative to the eligible window, from the expiry date as
 * the listing renders it.
 *
 * Returns `{ state, daysToExpiry, opensOn, closesOn }` where state is one of:
 *   'before-window' — earlier than expiry - 30 days: NO button (the C8 defect)
 *   'in-window'     — button expected
 *   'closing-day'   — exactly ON expiry + 3 calendar months: UNRESOLVED, see below
 *   'after-window'  — later than expiry + 3 calendar months: no button (R7)
 *   'unknown'       — no expiry on the row; judge nothing, report it
 *
 * **The closing day is its own state because the build's behaviour on it is not
 * settled.** Measured 26-08-2026 (`scripts/probe-boundary-day.js`, dump
 * `discovery/81-boundary-day.json`): NA62000984, expiry 26-05-2026 14:37, sat
 * exactly on its +3-month date, showed NO button, and carried no "Application
 * Extended Remarks" row and no green banner — so it was never extended and the
 * button was already gone. Two explanations fit, and they lead opposite ways:
 *
 *   (a) the window closes ONE DAY EARLY — last eligible day is closesOn - 1,
 *       which is a defect against "until 3 months after the expiry date";
 *   (b) the boundary is the TIMESTAMP, not the date — expiry time-of-day + 3
 *       months — and the probe ran at 15:07, thirty minutes after 14:37.
 *
 * (b) would also contradict Q4 ("day only, ignore time"), so it matters either
 * way. They are told apart by probing a record on its closing day before and
 * after its time-of-day: **NA62000987 closes 28-08-2026 at 09:19**
 * (`scripts/probe-closing-soon.js` keeps that list current). Until then callers
 * must RECORD this state rather than assert on it — a suite that guesses here
 * either hides a real off-by-one or fails green builds daily.
 */
function windowState(rawExpiry, now = today()) {
  const expiry = parseListingDate(rawExpiry);
  if (!expiry) return { state: 'unknown', daysToExpiry: null, opensOn: null, closesOn: null };

  const opensOn = addDays(expiry, -BEFORE_DAYS);
  const closesOn = addCalendarMonths(expiry, AFTER_MONTHS);
  const daysToExpiry = daysBetween(now, expiry);

  let state = 'in-window';
  if (now < opensOn) state = 'before-window';
  else if (now > closesOn) state = 'after-window';
  else if (+now === +closesOn) state = 'closing-day';

  return { state, daysToExpiry, opensOn, closesOn, expiry };
}

/**
 * The closing day has a TIME on it, and that is the whole of Q39.
 *
 * SETTLED 27-08-2026 BY MEASUREMENT, reversing the "date only" ruling this
 * file's windowState() comment above still describes. Two records were patched
 * onto the SAME closing day, each read minutes after an in-window control:
 *
 *   NA62000984  deadline today 14:37, not yet reached  -> button PRESENT
 *   NA62000987  deadline today 09:19, already elapsed  -> button ABSENT
 *
 * A DATE bound predicts the button present in both readings, so only the clock
 * explains the split. So: the BUTTON follows the timestamp; only the STATUS
 * follows the daily midnight cron (R12). "Past expiry" and "Expired" stay two
 * different things, which is why TS08.4/.5 must both still read Approved.
 *
 * That also retired the one-day-early defect draft: the 26-08 NA62000984
 * sighting was a probe thirty minutes LATE (15:07 against 14:37), not a bug.
 * The missing field was never the date — it was WHEN the reading was taken
 * relative to the record's own expiry time.
 *
 * Returns `{ hhmm, closesAt, elapsed }`, or null when the raw value carries no
 * time of day — in which case a caller must record rather than assert, because
 * a missing time is indistinguishable from midnight.
 */
function closingMoment(rawExpiry, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(rawExpiry || '').trim());
  if (!m) return null;
  const { closesOn } = windowState(rawExpiry);
  if (!closesOn) return null;
  const closesAt = new Date(
    closesOn.getFullYear(), closesOn.getMonth(), closesOn.getDate(), +m[4], +m[5], 0, 0,
  );
  return { hhmm: `${m[4]}:${m[5]}`, closesAt, elapsed: now > closesAt };
}

/** yyyy-mm-dd, for messages and annotations. */
const ymd = (d) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';

/**
 * HH:MM of an INSTANT — the clock half of a reading, for captions and sidecar lines
 * that place a take against a deadline. Added 30-08-2026 with the closing-day split:
 * ymd() alone cannot say which side of a closing moment a sitting stood on, and three
 * separate hand-rolled formatters in the spec is how two copies of one rule drift.
 */
const hhmmOf = (d) => (d instanceof Date && !Number.isNaN(+d)
  ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  : '');

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * WHICH CALENDAR CASE IS THIS? — TS09's whole subject, computed rather than assumed.
 *
 * TS09.1-.4 claims +30 is pure calendar arithmetic across month ends, leap years,
 * the year end and weekends. Until 28-08-2026 the recorder filmed that claim with
 * the generic `arith` caption, which states R3/R4 and the sum and never names the
 * calendar property under test — so a take of the leap-year case and a take of an
 * ordinary mid-month record produced identical frames. The checklist label promised
 * "month end / leap year / year end"; nothing on camera said which.
 *
 * `base` is the date the +30 is measured FROM: the record's own expiry under R3
 * (a pre-expiry click) and the click date under R4. Only R3 lets a test CHOOSE the
 * base, which is why reachableCalendarCases() below only searches R3 bases.
 *
 * Pure, and deliberately so — it is unit-exercised offline by
 * `node scripts/check-calendar-cases.js`, because a recorder branch that has never
 * run is a branch `node --check` cannot vouch for.
 */
function calendarCase(base) {
  const sum = addDays(base, 30);
  const monthEnd = base.getDate() === daysInMonth(base.getFullYear(), base.getMonth() + 1);
  const crossesYearEnd = sum.getFullYear() !== base.getFullYear();
  const weekendLanding = sum.getDay() === 0 || sum.getDay() === 6;

  // Does the 30-day span touch February at all? That is what makes a leap year
  // visible in the arithmetic — a base in January whose sum lands in March has
  // crossed a 28- or 29-day month, and the two give different answers.
  let februaryCrossed = null;
  for (let d = 0; d <= 30; d++) {
    const day = addDays(base, d);
    if (day.getMonth() === 1) {
      const days = daysInMonth(day.getFullYear(), 2);
      februaryCrossed = { year: day.getFullYear(), days, leap: days === 29 };
      break;
    }
  }

  const labels = [];
  if (monthEnd) {
    labels.push('the base is the LAST DAY of ' + MONTHS[base.getMonth()] + ' (' +
      daysInMonth(base.getFullYear(), base.getMonth() + 1) + ' days in that month)');
  }
  if (februaryCrossed) {
    labels.push('the 30 days cross February ' + februaryCrossed.year + ', which has ' +
      februaryCrossed.days + ' days (' + (februaryCrossed.leap ? 'LEAP year' : 'non-leap') + ')');
  }
  if (crossesYearEnd) labels.push('the sum crosses the YEAR END into ' + sum.getFullYear());
  if (weekendLanding) {
    labels.push('the sum lands on a ' + DOW[sum.getDay()] +
      ' - a WEEKEND, and REQ-005 forbids shifting it off one');
  }

  return {
    base, sum, monthEnd, crossesYearEnd, weekendLanding, februaryCrossed, labels,
    sumDow: DOW[sum.getDay()],
    plain: ymd(base) + ' + 30 days = ' + ymd(sum) + ' (' + DOW[sum.getDay()] + ')',
  };
}

/**
 * Every base a TS09 fixture could be patched to TODAY, and what each one tests.
 *
 * The constraint that decides this row, and it is not a supply problem: the base is
 * the record's own expiry ONLY under R3, and R3 needs the record inside the window
 * and still pre-expiry - i.e. the expiry in (today .. today + 30 days]. Past that
 * the window has not opened (REQ-003); before it, R4 applies and the base becomes
 * the click date, which no fixture can choose. So the reachable calendar cases are
 * a property of TODAY'S DATE, and two of TS09's four sub-cases are simply not
 * reachable in most months. Measured, never assumed.
 */
function calendarBasesFor(now = today()) {
  const out = [];
  for (let d = 1; d <= BEFORE_DAYS; d++) out.push(calendarCase(addDays(now, d)));
  return out;
}

/**
 * The four cases TS09 names, each answered with a reachable base or null.
 *
 * A null is the honest answer and it names its own remedy: the case needs the
 * machine clock moved, which is the same blocker TS23 is declared UNRECORDED for,
 * or it needs the calendar to come round to it.
 */
function reachableCalendarCases(now = today()) {
  const all = calendarBasesFor(now);
  const pick = (fn) => all.find(fn) || null;
  return {
    monthEnd: pick((c) => c.monthEnd),
    leapFebruary: pick((c) => c.februaryCrossed && c.februaryCrossed.leap),
    nonLeapFebruary: pick((c) => c.februaryCrossed && !c.februaryCrossed.leap),
    yearEnd: pick((c) => c.crossesYearEnd),
    weekend: pick((c) => c.weekendLanding),
  };
}

module.exports = {
  addCalendarMonths, addDays, daysBetween, parseListingDate, today, ymd, hhmmOf,
  windowState, BEFORE_DAYS, AFTER_MONTHS, daysInMonth, closingMoment,
  calendarCase, calendarBasesFor, reachableCalendarCases,
};

/**
 * THE INVERSE: what expiry date puts a record into the state I want to test?
 *
 * Everything above answers "given an expiry, where is this record". The support
 * tool (src/support.js) asks the opposite question, and it is the reason the
 * boundary suite exists at all: TS08/TS09/TS22 were filed BLOCKED by Q12 because
 * "nothing on the QA side can patch an expiry date". The support tool can, so the
 * only missing piece is turning a named boundary into the date to type into it.
 *
 * Do NOT compute these by hand at the call site. The two ends of the window count
 * in different units and the +3-month end CLAMPS, so the naive inverse is wrong in
 * both directions:
 *
 *   - "closing day = today - 90 days" is off by up to two days (see the table at
 *     the top of this file).
 *   - "closing day = today minus 3 calendar months" has TWO preimages on some
 *     days (30 Jan and 31 Jan both close on 30 Apr) and NONE on others: nothing
 *     closes on 31 December, because the 31st of September does not exist. A
 *     caller that assumes an answer exists will silently patch the wrong date.
 *
 * So this searches candidate dates through windowState() — the same function the
 * assertions use — and returns the first that lands in the requested state. The
 * search and the assertion therefore cannot disagree, which is the whole point.
 */

/** The states callers ask for, each with the date it PREFERS when several fit. */
const EXPIRY_TARGETS = {
  // Straightforward: the button should be there.
  'in-window':        { offset: 0,   want: (s) => s.state === 'in-window' },
  // Expires today — in-window, and the row reads as live rather than Expired.
  'expires-today':    { offset: 0,   want: (s, c, now) => +c === +now },
  // The first day the button is allowed: expiry - 30 days === today.
  'opens-today':      { offset: 30,  want: (s, c, now) => s.opensOn && +s.opensOn === +now },
  // The LAST day it must still be absent — one day before opening. This is the
  // fixture the C8 defect is measured on (the build shows the button ~88 days
  // early; the requirement says 30).
  'opens-tomorrow':   { offset: 31,  want: (s, c, now) => s.opensOn && daysBetween(now, s.opensOn) === 1 },
  'before-window':    { offset: 31,  want: (s) => s.state === 'before-window' },
  // Already past expiry but still inside the window — TS05's fixture.
  'expired-in-window':{ offset: -7,  want: (s, c, now) => s.state === 'in-window' && c < now },
  // Exactly on expiry + 3 calendar months. Q39 lives here: the build's behaviour
  // on this one day is unresolved (date boundary or timestamp boundary), so a
  // fixture patched to it is evidence, not an assertion.
  'closing-day':      { offset: -90, want: (s) => s.state === 'closing-day' },
  // The last FULL day inside the window — the closing day is tomorrow. TS08's
  // third fixture ("one day before the window's edge"), and the control that
  // makes the closing-day and closed-yesterday readings mean something: all
  // three must be probed together or a uniformly absent button reads as a
  // boundary when it is really a broken page.
  'closes-tomorrow':  { offset: -89, want: (s, c, now) => s.closesOn && daysBetween(now, s.closesOn) === 1 },
  // The first day the button must be gone.
  'closed-yesterday': { offset: -92, want: (s, c, now) => s.closesOn && daysBetween(s.closesOn, now) === 1 },
  'after-window':     { offset: -120, want: (s) => s.state === 'after-window' },
};

/** Candidate offsets: the preferred one first, then outwards a day at a time. */
function searchOrder(preferred, span = 400) {
  const out = [preferred];
  for (let d = 1; d <= span; d++) { out.push(preferred + d, preferred - d); }
  return out;
}

/**
 * The expiry date that puts a record into `target` as of `now`.
 *
 * Returns { target, expiry, ymd, state, opensOn, closesOn, offsetDays, exact }.
 * Throws when the target is unreachable today (31 December's closing day), because
 * a silently-substituted neighbouring date would be patched into staging and then
 * asserted on as though it were the boundary.
 */
function expiryForState(target, now = today()) {
  const spec = EXPIRY_TARGETS[target];
  if (!spec) {
    throw new Error(`Unknown expiry target "${target}". Known: ${Object.keys(EXPIRY_TARGETS).join(', ')}`);
  }
  for (const offset of searchOrder(spec.offset)) {
    const candidate = addDays(now, offset);
    const state = windowState(ymd(candidate), now);
    if (spec.want(state, candidate, now)) {
      return {
        target, expiry: candidate, ymd: ymd(candidate), state: state.state,
        opensOn: state.opensOn, closesOn: state.closesOn,
        offsetDays: offset, exact: offset === spec.offset,
      };
    }
  }
  throw new Error(
    `No expiry date puts a record in "${target}" as of ${ymd(now)}. ` +
    'This is a real property of the calendar, not a bug: with a +3-calendar-month ' +
    'window that clamps to month ends, some days are the closing day of no expiry ' +
    'date at all (nothing closes on 31 December). Pick a neighbouring day.',
  );
}

/** Every target reachable today, for a CLI listing or an error message. */
function reachableTargets(now = today()) {
  return Object.keys(EXPIRY_TARGETS).map((t) => {
    try { const p = expiryForState(t, now); return { target: t, ymd: p.ymd, exact: p.exact }; }
    catch (e) { return { target: t, ymd: null, error: e.message }; }
  });
}

Object.assign(module.exports, { EXPIRY_TARGETS, expiryForState, reachableTargets });

/* ===========================================================================
 * TS54 — telling "90 days" apart from "3 calendar months"
 * =========================================================================*/

/**
 * R5 has carried TWO rules for the upper bound since 24-08-2026 and nothing has
 * ever separated them: REQ-003 says "3 months after the expiry date", the BA
 * said "90 days" verbally, and on most dates the two agree to within a day or
 * two — close enough that every reading so far is consistent with both.
 *
 * THE VAULT'S ORIGINAL DESIGN FOR TS54 SPANNED NINE MONTHS. It named two fixed
 * fixtures (expiry 01-06-2026 and 01-02-2027) and six probe days between
 * 30-08-2026 and 02-05-2027, one of them the deciding reading. That is correct
 * and unrunnable: the second fixture points forward and the case cannot report
 * until May 2027.
 *
 * It does not have to. The vault itself allows the equivalent — *"the equivalent
 * built by patching an expiry that puts today between the two candidate closing
 * days"* — and that is a ONE-DAY, ONE-FIXTURE decision:
 *
 *   pick an expiry E such that   min(E+90d, E+3mo)  <  TODAY  <  max(E+90d, E+3mo)
 *
 * On such a day the two rules give OPPOSITE answers about the same record, so a
 * single reading of the button settles it:
 *
 *   button PRESENT -> the LATER of the two bounds is in force
 *   button ABSENT  -> the EARLIER one is
 *
 * Worked example for 26-08-2026: expiry 27-05-2026 gives +90d = 25-08-2026 and
 * +3mo = 27-08-2026. Today sits strictly between them. Present means three
 * calendar months; absent means ninety days.
 *
 * WHICH RULE IS "LATER" FLIPS WITH THE CALENDAR, and that is worth knowing
 * rather than assuming: a three-month span containing February is shorter than
 * 90 days (01-02-2027 +3mo = 01-05, +90d = 02-05), everywhere else it is longer.
 * So the two arms are not always both reachable on a given day — this returns
 * whichever are, and says so.
 */
function rulesDisagreeOn(now = today(), span = 400) {
  const out = [];
  for (let offset = -span; offset <= 0; offset++) {
    const expiry = addDays(now, offset);
    const byDays = addDays(expiry, 90);
    const byMonths = addCalendarMonths(expiry, AFTER_MONTHS);
    if (+byDays === +byMonths) continue;

    const earlier = byDays < byMonths ? byDays : byMonths;
    const later = byDays < byMonths ? byMonths : byDays;
    // STRICTLY between: the closing day itself is Q39's unresolved territory,
    // and a reading taken on it would answer a different question.
    if (!(now > earlier && now < later)) continue;

    out.push({
      expiry,
      expiryYmd: ymd(expiry),
      byDays, byDaysYmd: ymd(byDays),
      byMonths, byMonthsYmd: ymd(byMonths),
      earlier: byDays < byMonths ? '90-days' : '3-calendar-months',
      later: byDays < byMonths ? '3-calendar-months' : '90-days',
      gapDays: daysBetween(earlier, later),
      /** What a reading of the button on `now` would mean. */
      presentMeans: byDays < byMonths ? '3-calendar-months' : '90-days',
      absentMeans: byDays < byMonths ? '90-days' : '3-calendar-months',
    });
  }
  return out;
}

Object.assign(module.exports, { rulesDisagreeOn });
