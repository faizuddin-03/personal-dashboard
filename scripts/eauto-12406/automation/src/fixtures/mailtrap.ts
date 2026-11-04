import { request, type APIRequestContext } from "@playwright/test";
import { envFileHint } from "../../config/load-env";

/**
 * The staging mail sink.
 *
 * Nothing eAuto sends on staging reaches a real mailbox — it all lands in a
 * Mailtrap sandbox inbox. This reads that inbox over Mailtrap's API rather
 * than driving its web UI, because polling by recipient is reliable and
 * clicking through a third-party front end is not.
 *
 * ── Ported from `Mailtrap-Email-Checker` (Azfar, standalone CLI) ────────────
 * The list / find / bodies logic and the never-report-a-false-green rule come
 * from that tool. Three things it did not do are added here, each because a
 * test needs it:
 *
 *  - **Attachments.** The CLI never fetched one. An email whose attachment is
 *    the point passes there with no attachment at all.
 *  - **CC.** The CLI read `to_email` only. Several cases assert two CC
 *    recipients, and a missing CC is a real defect.
 *  - **Polling.** The CLI took one snapshot. If the send is queued rather than
 *    synchronous, a one-shot read fails on a slow email — and the mirror of
 *    that, a fixed sleep before an absence check, passes on one that simply
 *    had not arrived yet. Both are answered by waiting on a condition with a
 *    stated timeout.
 *
 * ── Never a false green ────────────────────────────────────────────────────
 * With no token configured every helper THROWS naming the missing key. The CLI
 * degraded to a "blocked" note because it was a CLI a human was reading; in a
 * spec a skipped check that reports nothing is a passed test that checked
 * nothing (qa-principles #5, #14).
 */

/** One message as the inbox lists it. Mailtrap's field names, not ours. */
export interface MailtrapMessage {
  id: number;
  subject: string;
  from_email: string;
  to_email: string;
  cc_email?: string;
  bcc_email?: string;
  sent_at?: string;
  created_at?: string;
  attachments_count?: number;
}

/** The three renderings of one message's body. */
export interface MailtrapBodies {
  html: string;
  txt: string;
  raw: string;
}

export interface MailtrapAttachment {
  id: number;
  filename: string;
  attachment_type: string;
  content_type: string;
  attachment_size: number;
  download_path?: string;
}

export interface FindCriteria {
  /** The subject must match this. */
  subjectRe?: RegExp;
  /** Recipient substring, case-insensitive. */
  to?: string;
  /** Only messages at or after this epoch-ms. */
  sinceMs?: number;
}

/**
 * Clock slack when filtering by time.
 *
 * The sink's clock and the runner's are not the same clock, and an email sent
 * a few seconds "before" the run started by one of them is still this run's
 * email. Ported from the CLI, which arrived at 60s the same way.
 */
const CLOCK_SLACK_MS = 60_000;

export class MailtrapClient {
  private ctx?: APIRequestContext;
  private readonly token: string;
  private readonly accountId: string;
  private readonly inboxId: string;

  constructor(
    token = process.env.MAILTRAP_TOKEN,
    accountId = process.env.MAILTRAP_ACCOUNT_ID,
    inboxId = process.env.MAILTRAP_INBOX_ID,
  ) {
    const missing = [
      !token && "MAILTRAP_TOKEN",
      !accountId && "MAILTRAP_ACCOUNT_ID",
      !inboxId && "MAILTRAP_INBOX_ID",
    ].filter(Boolean);

    if (missing.length) {
      throw new Error(
        `Mailtrap is not configured: set ${missing.join(" and ")} in ` +
          `${envFileHint()}. ` +
          "A spec that cannot read the sink must fail, not pass silently.",
      );
    }
    this.token = token!;
    this.accountId = accountId!;
    this.inboxId = inboxId!;
  }

  async connect(): Promise<void> {
    this.ctx = await request.newContext({
      baseURL: "https://mailtrap.io/",
      extraHTTPHeaders: { "Api-Token": this.token, Accept: "application/json" },
      ignoreHTTPSErrors: true,
    });
  }

  private get api(): APIRequestContext {
    if (!this.ctx) throw new Error("MailtrapClient is not connected. Call connect() first.");
    return this.ctx;
  }

  private get inboxPath(): string {
    return `api/accounts/${this.accountId}/inboxes/${this.inboxId}`;
  }

  /** Every message in the inbox, newest first. */
  async list(): Promise<MailtrapMessage[]> {
    const res = await this.api.get(`${this.inboxPath}/messages`);
    if (!res.ok()) {
      throw new Error(`Mailtrap list failed with ${res.status()} ${res.statusText()}.`);
    }
    const body = (await res.json()) as MailtrapMessage[] | { data?: MailtrapMessage[] };
    const rows = Array.isArray(body) ? body : (body.data ?? []);
    return rows
      .slice()
      .sort((a, b) => String(b.sent_at ?? b.created_at ?? "").localeCompare(String(a.sent_at ?? a.created_at ?? "")));
  }

  /** Messages matching the criteria, newest first. Empty when none do. */
  async find(criteria: FindCriteria = {}): Promise<MailtrapMessage[]> {
    const { subjectRe, to, sinceMs = 0 } = criteria;
    const rows = await this.list();
    return rows.filter((m) => {
      const at = Date.parse(m.sent_at ?? m.created_at ?? "");
      if (sinceMs && Number.isFinite(at) && at < sinceMs - CLOCK_SLACK_MS) return false;
      if (subjectRe && !subjectRe.test(m.subject ?? "")) return false;
      if (to && !String(m.to_email ?? "").toLowerCase().includes(to.toLowerCase())) return false;
      return true;
    });
  }

  /**
   * Wait for a matching message to arrive.
   *
   * This is the answer to "is the send synchronous or queued" — it does not
   * need to know. It polls until the message is there or the timeout is spent,
   * then throws naming what it was looking for, so a missing email reads as a
   * missing email rather than as a timeout on some locator.
   */
  async waitFor(criteria: FindCriteria, timeout = 60_000, pollMs = 2_000): Promise<MailtrapMessage> {
    const deadline = Date.now() + timeout;
    let seen = 0;
    for (;;) {
      const hits = await this.find(criteria);
      if (hits.length) return hits[0];
      seen = (await this.list()).length;
      if (Date.now() >= deadline) break;
      await new Promise((r) => setTimeout(r, pollMs));
    }
    throw new Error(
      `No email matching ${criteria.subjectRe ?? "(any subject)"}` +
        `${criteria.to ? ` to "${criteria.to}"` : ""} arrived within ${timeout}ms. ` +
        `${seen} message(s) are in the inbox.`,
    );
  }

  /**
   * Prove NO matching message arrives, by watching for a stated quiet period.
   *
   * A single read after an arbitrary sleep cannot tell "never sent" from "not
   * sent yet", so this watches for the whole window and fails the moment one
   * turns up. `quietFor` has to be longer than the send path's worst case —
   * which is why whether the send is queued is a question for dev, not a
   * number to guess.
   */
  async assertNone(criteria: FindCriteria, quietFor = 60_000, pollMs = 5_000): Promise<void> {
    const deadline = Date.now() + quietFor;
    for (;;) {
      const hits = await this.find(criteria);
      if (hits.length) {
        throw new Error(
          `Expected NO email, but ${hits.length} arrived — e.g. "${hits[0].subject}" ` +
            `to ${hits[0].to_email}.`,
        );
      }
      if (Date.now() >= deadline) return;
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }

  /** A message's three body renderings. Missing ones come back as "". */
  async bodies(id: number): Promise<MailtrapBodies> {
    const out: MailtrapBodies = { html: "", txt: "", raw: "" };
    for (const [key, suffix] of [
      ["html", "body.html"],
      ["txt", "body.txt"],
      ["raw", "body.raw"],
    ] as const) {
      const res = await this.api.get(`${this.inboxPath}/messages/${id}/${suffix}`).catch(() => null);
      if (res?.ok()) out[key] = await res.text();
    }
    return out;
  }

  /** Every body joined, for a single "does the email say X" search. */
  async bodyText(id: number): Promise<string> {
    const b = await this.bodies(id);
    return `${b.html}\n${b.txt}\n${b.raw}`;
  }

  /**
   * A message's attachments.
   *
   * The CLI this was ported from had nothing for these, so an email whose
   * attachment IS the requirement passed there carrying none.
   */
  async attachments(id: number): Promise<MailtrapAttachment[]> {
    const res = await this.api.get(`${this.inboxPath}/messages/${id}/attachments`);
    if (!res.ok()) {
      throw new Error(`Mailtrap attachments failed with ${res.status()} for message ${id}.`);
    }
    const body = (await res.json()) as MailtrapAttachment[] | { data?: MailtrapAttachment[] };
    return Array.isArray(body) ? body : (body.data ?? []);
  }

  /**
   * Download one attachment's bytes.
   *
   * "Presence of an attachment, and that it opens" is two checks: that it is
   * listed, and that its bytes are actually servable and non-empty. A listing
   * row proves only the first.
   */
  async attachmentBytes(messageId: number, attachmentId: number): Promise<Buffer> {
    const res = await this.api.get(
      `${this.inboxPath}/messages/${messageId}/attachments/${attachmentId}/download`,
    );
    if (!res.ok()) {
      throw new Error(
        `Attachment ${attachmentId} on message ${messageId} did not download: ${res.status()}.`,
      );
    }
    return Buffer.from(await res.body());
  }

  /** Everyone a message went to, lowercased — To, CC and BCC in one list. */
  recipients(m: MailtrapMessage): { to: string[]; cc: string[]; bcc: string[] } {
    const split = (v?: string): string[] =>
      String(v ?? "")
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return { to: split(m.to_email), cc: split(m.cc_email), bcc: split(m.bcc_email) };
  }

  async close(): Promise<void> {
    await this.ctx?.dispose();
    this.ctx = undefined;
  }
}
