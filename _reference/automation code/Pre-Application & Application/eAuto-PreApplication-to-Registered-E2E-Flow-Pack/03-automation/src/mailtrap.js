/**
 * Mailtrap — the mail catcher TS19 / REQ-009 reads (Charmain, 26-08-2026:
 * *"the email part can check in mailtrap, as long as there is no email sending
 * after the extension then should be pass, just check 1 or 2 should be
 * sufficient."*).
 *
 * That answers Q38. REQ-009 is a negative requirement — *"No email is sent to
 * the potential UCD or the BackOffice user after an extension"* — and Mailtrap
 * is a better witness than an inbox for one specific reason: it catches
 * EVERYTHING the environment tries to send, to any address. So "nothing for this
 * application" is a statement about the whole outgoing stream, not just about one
 * mailbox that might have been filtered.
 *
 * THE ONE THING THIS MODULE INSISTS ON, cheaply. A silent catcher and a dead mail
 * pipe look identical. Rather than the control action the drafted dev message
 * asked for — a whole extra fixture, which is what Charmain trimmed — this reads
 * the inbox's most recent traffic in the SAME request and reports it. One glance,
 * no extra work: if Mailtrap has recent messages from other flows, silence about
 * the extension means something. If it has never received anything, the run says
 * so instead of passing.
 *
 * CONFIGURATION — nothing here holds a token.
 *
 *   MAILTRAP_API_TOKEN=...        (an API token with read access to the inbox)
 *   MAILTRAP_INBOX_ID=1234567
 *   MAILTRAP_ACCOUNT_ID=987654    (optional; needed by the newer API host)
 *   MAILTRAP_HOST=mailtrap.io     (optional override)
 *
 * Put them in the shared credential file the rest of this harness uses,
 * `~/.claude/secrets/eauto.env` — same place as every password, so there is one
 * copy and no drift. `configured()` is false without them and every consumer
 * skips rather than failing, so the suite stays green on a machine that has no
 * mail access.
 */
require('./accounts'); // hydrates process.env from the shared store + project .env

const HOST = process.env.MAILTRAP_HOST || 'mailtrap.io';
const TOKEN = process.env.MAILTRAP_API_TOKEN || '';
const INBOX = process.env.MAILTRAP_INBOX_ID || '';
const ACCOUNT = process.env.MAILTRAP_ACCOUNT_ID || '';

const configured = () => Boolean(TOKEN && INBOX);

/** Why a run skipped, in the words a tester needs to fix it. */
function whyNotConfigured() {
  const missing = [];
  if (!TOKEN) missing.push('MAILTRAP_API_TOKEN');
  if (!INBOX) missing.push('MAILTRAP_INBOX_ID');
  return (
    'Mailtrap is not wired up: ' + missing.join(' and ') + ' missing. ' +
    'Add them to ~/.claude/secrets/eauto.env (never to the project .env) and re-run. ' +
    'Until then TS19 is a manual check — open the Mailtrap inbox by hand.'
  );
}

/**
 * Both API shapes, because Mailtrap has two and which one a token works against
 * depends on when the account was created. Tried in order; the first that
 * answers 200 wins, and which one worked is reported so nobody debugs it twice.
 */
function endpoints(path = '') {
  const list = [];
  if (ACCOUNT) {
    list.push(`https://${HOST}/api/accounts/${ACCOUNT}/inboxes/${INBOX}/messages${path}`);
  }
  list.push(`https://${HOST}/api/v1/inboxes/${INBOX}/messages${path}`);
  return list;
}

/** GET with the token in the header Mailtrap expects. Never logs the token. */
async function get(url) {
  const res = await fetch(url, {
    headers: { 'Api-Token': TOKEN, Accept: 'application/json' },
  });
  const text = await res.text();
  return { status: res.status, text, url };
}

/**
 * Recent messages, newest first.
 *
 * Returns `{ ok, via, messages, tried }`. `ok:false` carries the statuses rather
 * than throwing, so a test can report "Mailtrap said 401" instead of dying with
 * a stack trace that names nothing useful.
 */
async function messages({ limit = 30 } = {}) {
  if (!configured()) return { ok: false, reason: whyNotConfigured(), messages: [], tried: [] };
  const tried = [];
  for (const url of endpoints()) {
    const r = await get(url);
    tried.push({ url: url.replace(/\/\/[^/]+/, '//<host>'), status: r.status });
    if (r.status !== 200) continue;
    let data;
    try {
      data = JSON.parse(r.text);
    } catch {
      continue;
    }
    const list = Array.isArray(data) ? data : data.data || data.messages || [];
    return {
      ok: true,
      via: url.includes('/api/accounts/') ? 'accounts API' : 'v1 API',
      messages: list.slice(0, limit).map((m) => ({
        id: m.id,
        subject: m.subject || '',
        to: m.to_email || (Array.isArray(m.to) ? m.to.join(', ') : m.to) || '',
        from: m.from_email || m.from || '',
        sentAt: m.sent_at || m.created_at || '',
        body: '',
      })),
      tried,
    };
  }
  return {
    ok: false,
    reason: 'Mailtrap did not answer 200 on either API shape — check the token, the inbox id, and MAILTRAP_ACCOUNT_ID',
    messages: [],
    tried,
  };
}

/** Parse whatever date shape Mailtrap returned; null when unusable. */
function when(m) {
  const t = Date.parse(m.sentAt || '');
  return Number.isFinite(t) ? t : null;
}

/**
 * The TS19 verdict for ONE extension.
 *
 * `since` is the moment just before the Confirm click; `needles` are the strings
 * that would tie a message to this extension — the application number, the
 * dealer email, the company name. Anything arriving after `since` that mentions
 * one of them is a REQ-009 failure.
 *
 * Returns:
 *   pass      — nothing matching arrived after `since`
 *   after     — the messages that did arrive after `since` (any recipient)
 *   matching  — the subset that mentions a needle: the actual defect evidence
 *   liveness  — { total, newest, newestAt } — the cheap control. `total: 0` on a
 *               brand-new inbox means the silence proves nothing, and the caller
 *               is expected to say so rather than record a pass.
 */
async function checkNoMailSince(since, needles = []) {
  const res = await messages({ limit: 50 });
  if (!res.ok) return { ok: false, reason: res.reason, tried: res.tried };

  const hay = (m) => `${m.subject} ${m.to} ${m.from}`.toLowerCase();
  const terms = needles.filter(Boolean).map((n) => String(n).toLowerCase());

  const after = res.messages.filter((m) => {
    const t = when(m);
    return t === null ? false : t >= since;
  });
  const matching = after.filter((m) => terms.some((t) => hay(m).includes(t)));
  const newest = res.messages[0] || null;

  return {
    ok: true,
    via: res.via,
    pass: matching.length === 0,
    after,
    matching,
    liveness: {
      total: res.messages.length,
      newest: newest ? `${newest.sentAt} — ${newest.subject} -> ${newest.to}` : null,
      newestAt: newest ? when(newest) : null,
    },
    // Undated messages cannot be placed either side of the click. Counted rather
    // than silently dropped: a pass built on messages nobody could time is weaker
    // than it looks.
    undated: res.messages.filter((m) => when(m) === null).length,
  };
}

module.exports = { configured, whyNotConfigured, messages, checkNoMailSince, HOST, INBOX: Boolean(INBOX) };

/* ===========================================================================
 * THE SCREEN READING — added 31-08-2026, after a dry run in Charmain's own
 * Chrome proved the recorder's inbox URL 404s.
 *
 * Everything above talks to the API, which needs a token this machine does not
 * have. Everything below reads the inbox as a person sees it, which is the
 * artefact TS19's trigger-point block always said it was. The two stay separate
 * on purpose: neither stands in for the other.
 *
 * These are pure functions over text so the recorder's branch can be exercised
 * offline — `npm run probe:mailbox`. A leg that has never run, and that nobody
 * can make FAIL on purpose, is a leg whose pass means nothing.
 * =========================================================================== */

/**
 * The message list, parsed out of the inbox's own innerText.
 *
 * Mailtrap renders each row as three lines — subject, `to: <address>`, then a
 * RELATIVE time ("10 hours ago"). The relative time is the only one on the list
 * page, and it is the one to trust: the absolute stamp Mailtrap shows when a
 * message is OPENED is UTC with nothing marking it as UTC, eight hours behind
 * MYT. Measured 31-08-2026 — the header bar read `2026-08-31 00:00` on a message
 * whose own `Date` header read `Mon, 31 Aug 2026 08:00:06 +0800`.
 */
function parseInboxScreen(text = '') {
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  for (let i = 0; i < lines.length; i += 1) {
    const to = /^to:\s*<(.+)>$/i.exec(lines[i]);
    if (!to) continue;
    const subject = lines[i - 1] || '';
    const ago = /\b(just now|\d+\s+(second|minute|hour|day|month|year)s?\s+ago)\b/i.exec(lines[i + 1] || '');
    // A row with no subject line above it is a fragment of some other part of the
    // page, not a message. Dropped rather than counted: an inflated row count is a
    // liveness reading that cannot be trusted.
    if (!subject || /^to:/i.test(subject)) continue;
    rows.push({ subject, to: to[1], ago: ago ? ago[0] : null });
  }
  return rows;
}

/**
 * WHICH OF THE THREE THINGS IS ON SCREEN — and they are three, not two.
 *
 *   'error'  a 404 or a route Mailtrap has moved. The old recorder URL served
 *            exactly this and nothing detected it.
 *   'login'  a real Mailtrap page with nobody signed in.
 *   'empty'  a mailbox with no rows. A legitimate state, and NOT the same as a
 *            broken route — collapsing the two makes the run report a silent
 *            catcher when the truth is a wrong address, which is the wrong
 *            diagnosis in the sidecar for ever.
 *   'inbox'  message rows, readable.
 */
function inboxScreenState(text = '') {
  const t = String(text);
  if (/page not found|doesn't exist or has been moved/i.test(t)) return 'error';
  if (parseInboxScreen(t).length > 0) return 'inbox';
  if (/sign\s*in|log\s*in/i.test(t)) return 'login';
  return 'empty';
}

/** Shorthand for "is there a readable message list here". */
function looksLikeInboxScreen(text = '') {
  return inboxScreenState(text) === 'inbox';
}

/**
 * The subjects that ARE the expiry-reminder family on this environment.
 *
 * Taken from the traffic actually in the sandbox, not from a guess: the live
 * subject is `<APPNO> - <COMPANY>: Your Application Link Has Expired`. The rest
 * are there because a rename is likelier than a new mechanism, and a family
 * matched too narrowly reports "no reminder" when one is sitting in frame.
 */
const REMINDER_SUBJECT = /application link has expired|expiry reminder|expiring soon|about to expire|reminder/i;

/**
 * THE VERDICT FOR TS21 / E2E_TS9 / E2E_TS10 — "no expiry reminder for this record".
 *
 * `rows` is the inbox FILTERED to this application, so the other mails it holds
 * for the same record are the positive control: they prove the catcher receives
 * for this address, which is what turns silence into evidence. Zero rows is NOT
 * a pass — the sandbox caps at 600 messages and evicts the oldest, so an empty
 * result cannot tell "no reminder was sent" from "this record's mail aged out"
 * or "the search matched nothing". That is the never-observed / observed-false
 * line, and it is refused rather than passed.
 */
function reminderVerdict({ rows = [], appNo = '', windowTraffic = 0 } = {}) {
  const family = rows.filter((r) => REMINDER_SUBJECT.test(r.subject || ''));
  if (family.length) {
    return {
      ok: false,
      family,
      control: 'n/a',
      controlRows: rows.length - family.length,
      reason: `a reminder-family message IS in the catcher for ${appNo || 'this application'}: ` +
              JSON.stringify(family.map((f) => f.subject).slice(0, 3)),
    };
  }
  // THE STRONGEST CONTROL — this record's OWN other mail. It proves the catcher
  // receives for this exact address, so the silence is about the reminder.
  if (rows.length) {
    return {
      ok: true,
      family: [],
      control: 'record',
      controlRows: rows.length,
      reason: `${rows.length} message(s) for ${appNo || 'this application'} and not one of them a reminder — ` +
              'the catcher demonstrably receives for this address',
    };
  }
  // THE WEAKER ONE, AND IT IS STILL A CONTROL. Mailtrap intercepts the whole
  // outgoing stream, not one mailbox, so traffic from ANY flow in the same window
  // shows a reminder would have been caught had one been sent. Accepted when the
  // record has no mail of its own — which is the normal case for a record that has
  // never been mailed — but LABELLED, because it is not the same claim and a
  // reader must never have to guess which control carried the point.
  if (windowTraffic > 0) {
    return {
      ok: true,
      family: [],
      control: 'window',
      controlRows: windowTraffic,
      reason: `nothing at all for ${appNo || 'this application'}, and no reminder among it. The control is ` +
              `WEAKER than usual: it is the catcher's own traffic in the same window (${windowTraffic} message(s)) ` +
              'rather than mail for this record, so it shows the catcher was receiving, not that it receives for ' +
              'this address specifically',
    };
  }
  // Neither control. This is the state that must never read as a pass.
  return {
    ok: false,
    family: [],
    control: 'none',
    controlRows: 0,
    reason: `nothing for ${appNo || 'this application'} AND nothing in the catcher at all for the window, so ` +
            'this take cannot tell "no reminder was sent" from "the catcher cannot see that far back". The ' +
            'sandbox caps at 600 messages and evicts the oldest — measured 31-08-2026, it reached back only ' +
            'THREE DAYS. An absence with no positive control is not evidence',
  };
}

module.exports.parseInboxScreen = parseInboxScreen;
module.exports.looksLikeInboxScreen = looksLikeInboxScreen;
module.exports.inboxScreenState = inboxScreenState;
module.exports.reminderVerdict = reminderVerdict;
module.exports.REMINDER_SUBJECT = REMINDER_SUBJECT;

/**
 * What is in the AFTER search that was not in the BEFORE one, by subject.
 *
 * A set difference, deliberately, because it needs no clock. Mailtrap's displayed
 * stamps are UTC with nothing saying so (MYT minus 8), so anything that compared
 * them against a local click time would be eight hours wrong; a subject present
 * after and absent before is mail that arrived, whatever any stamp claims.
 */
function freshSubjects(before = [], after = []) {
  const was = new Set(before.map((r) => r.subject));
  return after.filter((r) => !was.has(r.subject));
}

/**
 * THE TS19 AFTER-VERDICT over two independent readings.
 *
 * The screen is the artefact and the API is the second opinion, so EITHER can carry
 * the point — but only when it was actually taken. Three rules, and the first is the
 * one the old code broke:
 *
 *   - a reading that merely ANSWERED is not a pass; it has to have come back empty
 *   - no reading at all is a REFUSAL, never a pass. An absence nobody measured is
 *     not evidence
 *   - two readings that DISAGREE are not a pass either. That is not a tie to be
 *     broken by whichever is more convenient; it is the one outcome worth a
 *     person's attention, and it is reported as itself
 */
function afterVerdict({
  screenRead = false, screenClean = false, screenControl = 0,
  apiRead = false, apiClean = false,
} = {}) {
  // A SEARCH THAT RETURNED NOTHING BEFORE **AND** NOTHING AFTER IS NOT A CLEAN
  // READING — it is a diff of two empty sets, which is trivially equal and proves
  // nothing about this record. `screenControl` is how many messages the BEFORE
  // search found: with none, the catcher has never been shown to receive for this
  // address, and the screen half is discounted rather than counted as a pass.
  const screenUsable = screenRead && screenControl > 0;
  const disagree = screenUsable && apiRead && screenClean !== apiClean;
  const anyRead = screenUsable || apiRead;
  const allClean = (!screenUsable || screenClean) && (!apiRead || apiClean);
  return {
    clean: Boolean(anyRead && allClean && !disagree),
    disagree,
    anyRead,
    screenUsable,
    // Stated so the sidecar can say WHY the screen was discounted rather than
    // leaving a reader to infer it from a refusal with no cause.
    noControl: screenRead && screenControl === 0,
  };
}

module.exports.freshSubjects = freshSubjects;
module.exports.afterVerdict = afterVerdict;
