import { expect, test } from "@playwright/test";
import type { MailtrapClient, MailtrapMessage } from "./mailtrap";
import { contract, SUBJECT_ENCODING_DEFECT, type EmailContract } from "@data/email-contracts";

/**
 * Check one email against its contract, field by field.
 *
 * Split from `mailtrap.ts` on purpose: that file knows how to READ the sink,
 * this one knows what a PASS means. The CLI this is ported from mixed the two,
 * which is why its reader could not be reused without dragging its bespoke
 * harness object along.
 */

export interface EmailExpectation {
  /** A key in `@data/email-contracts`. */
  type: string;
  /** The recipient this run used — the unique per-run address. */
  to: string;
  /** Only consider mail at or after this epoch-ms. Usually the run's start. */
  sinceMs: number;
  /** Run-specific values the body must show, by contract field name. */
  vars?: Record<string, string | number | undefined>;
  /** How long to wait for it. Longer when the send is queued. */
  timeout?: number;
}

/**
 * Assert the expected email arrived and matches its contract.
 *
 * Returns the message so a caller can make further checks the contract does
 * not cover.
 */
export async function assertEmail(
  mail: MailtrapClient,
  expectation: EmailExpectation,
): Promise<MailtrapMessage> {
  const c: EmailContract = contract(expectation.type);

  return test.step(`Email · ${c.label}`, async () => {
    const msg = await mail.waitFor(
      { subjectRe: c.subjectRe, to: expectation.to, sinceMs: expectation.sinceMs },
      expectation.timeout ?? 60_000,
    );

    // ── envelope ───────────────────────────────────────────────────────────
    expect(String(msg.from_email).toLowerCase(), `sender of "${msg.subject}"`).toContain(
      c.from.toLowerCase(),
    );

    const who = mail.recipients(msg);
    expect(who.to.join(","), `recipient of "${msg.subject}"`).toContain(
      expectation.to.toLowerCase(),
    );

    for (const cc of c.ccMustContain ?? []) {
      expect(who.cc, `CC list of "${msg.subject}"`).toContain(cc.toLowerCase());
    }

    // ── subject ────────────────────────────────────────────────────────────
    // The encoding defect is RAISED, never accepted as the expected copy.
    if (SUBJECT_ENCODING_DEFECT.re.test(msg.subject)) {
      test.info().annotations.push({
        type: "known-issue",
        description: `${SUBJECT_ENCODING_DEFECT.id} — subject="${msg.subject}". ${SUBJECT_ENCODING_DEFECT.note}`,
      });
    }

    // ── body ───────────────────────────────────────────────────────────────
    const body = await mail.bodyText(msg.id);

    for (const re of c.mustContain ?? []) {
      expect(body, `body of "${msg.subject}" must contain ${re}`).toMatch(re);
    }

    for (const s of c.shouldContain ?? []) {
      if (!s.re.test(body)) {
        test.info().annotations.push({
          type: s.deviation ? "deviation" : "verify",
          description: `${c.label} — ${s.what}: not found (${s.re})`,
        });
      }
    }

    for (const field of c.dynamicFields ?? []) {
      const v = expectation.vars?.[field];
      if (v === undefined || v === "") continue;
      expect(body, `body of "${msg.subject}" should show ${field}="${v}"`).toContain(String(v));
    }

    // ── attachments ────────────────────────────────────────────────────────
    // Two checks, because a listing row does not prove the file opens.
    if (c.attachments) {
      const files = await mail.attachments(msg.id);
      expect(files, `attachments on "${msg.subject}"`).toHaveLength(c.attachments.count);

      for (const f of files) {
        if (c.attachments.filenameRe) {
          expect(f.filename, "attachment filename").toMatch(c.attachments.filenameRe);
        }
        const bytes = await mail.attachmentBytes(msg.id, f.id);
        expect(bytes.length, `"${f.filename}" downloaded ${bytes.length} bytes`).toBeGreaterThan(0);
      }
    }

    test.info().annotations.push({
      type: "email",
      description: `${c.label} · id=${msg.id} · to=${msg.to_email} · "${msg.subject}"`,
    });
    return msg;
  });
}

/**
 * Assert the expected email does NOT arrive.
 *
 * `quietFor` must exceed the send path's worst case. If sending is queued and
 * the window is shorter than the queue's latency, this passes on an email that
 * simply had not been delivered yet — a false green on the exact case the
 * check exists for.
 */
export async function assertNoEmail(
  mail: MailtrapClient,
  opts: { type?: string; to: string; sinceMs: number; quietFor?: number; reason?: string },
): Promise<void> {
  const subjectRe = opts.type ? contract(opts.type).subjectRe : undefined;
  const why = opts.reason ? ` (${opts.reason})` : "";

  await test.step(`Email · none expected${why}`, async () => {
    await mail.assertNone(
      { subjectRe, to: opts.to, sinceMs: opts.sinceMs },
      opts.quietFor ?? 60_000,
    );
  });
}
