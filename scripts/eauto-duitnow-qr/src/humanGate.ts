/**
 * The two moments this run hands control to a person.
 *
 * Both are *waits on a page state change*, never fixed sleeps — a fixed sleep
 * either wastes minutes or expires while the human is mid-action. Each prints a
 * loud banner to stdout so the dashboard's live log shows exactly what is being
 * asked for and how long is left.
 */
import type { Page } from "@playwright/test";

export function banner(lines: string[]): void {
  const width = Math.max(...lines.map(l => l.length)) + 4;
  const bar = "=".repeat(width);
  console.log(`\n${bar}`);
  for (const l of lines) console.log(`  ${l}`);
  console.log(`${bar}\n`);
}

interface WaitOpts {
  /** What we are waiting for. Resolve true to finish, false to keep waiting. */
  until: () => Promise<boolean>;
  budgetMs: number;
  pollMs?: number;
  what: string;
  /** Optional early-abort — e.g. the popup closed itself on timeout. */
  abortIf?: () => Promise<string | null>;
}

/**
 * Poll `until` until it is true, the budget runs out, or `abortIf` returns a
 * reason. Announces remaining time every 30s so an unattended dashboard still
 * shows progress rather than looking hung.
 */
export async function waitForHuman(opts: WaitOpts): Promise<void> {
  const pollMs = opts.pollMs ?? 3_000;
  const deadline = Date.now() + opts.budgetMs;
  let lastAnnounce = 0;

  while (Date.now() < deadline) {
    if (await opts.until()) {
      console.log(`[human-gate] ${opts.what} — done.`);
      return;
    }
    if (opts.abortIf) {
      const reason = await opts.abortIf();
      if (reason) throw new Error(`${opts.what} aborted: ${reason}`);
    }
    const left = Math.round((deadline - Date.now()) / 1000);
    if (Date.now() - lastAnnounce > 30_000) {
      console.log(`[human-gate] still waiting on ${opts.what} — ${left}s left`);
      lastAnnounce = Date.now();
    }
    await new Promise(r => setTimeout(r, pollMs));
  }
  throw new Error(
    `STOPPED: timed out waiting for the operator on ${opts.what} ` +
    `after ${Math.round(opts.budgetMs / 1000)}s. Nothing is lost — the run simply ended.`
  );
}

/**
 * The reCAPTCHA gate at /obs/preOnb/recaptcha.
 *
 * Not solvable from this side, and the reference rig measured that the saved
 * session is NOT reliably reusable — budget one tick per run and say so out
 * loud before the operator wanders off.
 */
export async function passRecaptchaGate(page: Page, budgetMs: number): Promise<void> {
  const onForm = async () => /\/obs\/preOnb\/form/.test(page.url());
  if (await onForm()) {
    console.log("[human-gate] reCAPTCHA skipped — the session already reaches the form.");
    return;
  }
  banner([
    "ACTION NEEDED — reCAPTCHA",
    "Tick the reCAPTCHA in the browser window that just opened.",
    "Expect two or three image challenges before VERIFY passes.",
  ]);
  await waitForHuman({
    until: onForm,
    budgetMs,
    what: "the reCAPTCHA gate",
  });
}
