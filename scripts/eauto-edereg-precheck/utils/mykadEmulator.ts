import { BrowserContext } from '@playwright/test';
import { recordSubPageVideo } from './videoManifest';
import { CONFIG } from '../data/config';

/**
 * Drives the local MyKad Reader Emulator (knowledge/mykad-emulator.md) — a
 * WebSocket server at `ws://localhost:7878/IDCard`, distinct from eSIM, that
 * stands in for the physical Dermalog MyKad/thumbprint reader hardware. The
 * AATF portal's own `mykad-websocket-v2.js` already holds its own open
 * connection to the same address on every MyKad/thumbprint auth screen; this
 * client is a second, independent connection that just sends `INSERTCARD`,
 * exactly like the emulator's own control-panel page
 * (_reference/html/mykad-emulator/control-panel.html) does. Protocol and
 * card JSON shape are taken verbatim from that capture.
 *
 * Card data matches the "FaizuddinAATF" profile, i.e. the confirmed AATF
 * login account (NRIC 030217141005, MUHAMMAD FAIZUDDIN BIN BIDI) — the
 * emulator's virtual MyKad must be the same identity the portal expects to
 * authenticate, same as the real-hardware flow.
 */
export const CARD_FAIZUDDIN_AATF = {
  NRIC: '030217141005',
  GMPCName: 'MUHAMMAD FAIZUDDIN BIN BIDI',
  OriginalName: 'MUHAMMAD FAIZUDDIN BIN BIDI',
  Gender: 'L',
  DOB: '01/01/1988',
  POB: 'JOHOR',
  DateIssue: '01/01/2010',
  Citizenship: 'WARGANEGARA',
  Race: 'MELAYU',
  Religion: 'ISLAM',
  Category: 'Normal',
  Address1: 'NO 1 JALAN TEST',
  Address2: 'TAMAN SIMULATOR',
  Postcode: '81100',
  City: 'JOHOR BAHRU',
  State: 'JOHOR',
  LeftHandCode: 'R1',
  RightHandCode: 'L1',
} as const;

declare global {
  interface Window {
    __mykadWs?: WebSocket;
    __mykadAcks?: string[];
  }
}

/**
 * Opens a throwaway page per `insertCard()` call, connects, sends, waits for
 * the ack, then closes it again — NOT one connection kept open across the
 * whole Deregistration flow. That was the original design and it broke this
 * suite: `PrecheckSession.active()` (utils/session.ts) treats the LAST open
 * page in the context as "the active page," so a lingering `about:blank`
 * emulator page silently became "active" the moment `insertCard()` first
 * ran, and every subsequent `waitForActivePage()` call handed page objects
 * back to code that was actually trying to drive the real AATF tab —
 * visible as a blank second tab that never went away, with the flow stalled
 * because it was now interacting with the wrong page. Confirmed live
 * 2026-08-22. Fixed by never letting the emulator page outlive its own
 * `insertCard()` call.
 *
 * The emulator itself doesn't care which screen is asking or how many times
 * `insertCard()` reconnects — it just answers whoever's listening on
 * `/IDCard` (knowledge/mykad-emulator.md § "Automation shape"). The card
 * auto-ejects after each screen's own read completes anyway, so a fresh
 * connection per call was always required, never just an optimization.
 *
 * ⚠️ Multi-session handling between this connection and the AATF page's own
 * connection is flagged unconfirmed in knowledge/mykad-emulator.md — this
 * has only been verified for a single connection at a time.
 */
export class MykadEmulatorClient {
  private readonly wsUrl: string;
  private readonly card: Record<string, string>;

  /** `opts.nric`/`opts.name` default to `CONFIG.mykadNric`/`mykadName` (the
   *  MAIN account's identity) — everything else in the card
   *  (DOB/address/etc.) stays `CARD_FAIZUDDIN_AATF`'s values regardless of
   *  identity, since only NRIC/name need to match a given login account
   *  for the portal's own auth check.
   *
   *  CORRECTED 2026-08-26, per Faizuddin ("its not choosing... i think the
   *  automation injects the ic and name" — both users were coming through
   *  as the SAME identity): an earlier version of this tried to look a
   *  "profile name" up in the control panel page's own `localStorage`
   *  (`mykad_user_profiles`) so colleagues could just save their own named
   *  profile there. That's fundamentally broken for automation — Playwright
   *  launches a fresh, ISOLATED browser context every run (no
   *  `launchPersistentContext`/`userDataDir` anywhere in this suite), so
   *  its `localStorage` is NEVER the same profile a human saved by hand in
   *  their own real browser. The lookup silently found nothing every time
   *  and fell back to the same default identity for every caller — never
   *  actually validated live before this was caught. Fixed by injecting
   *  the NRIC/name directly instead (same shape `CARD_FAIZUDDIN_AATF`
   *  always used) — a colleague still doesn't need to edit code, they just
   *  type their own NRIC/name into the dashboard instead of a profile
   *  name. See knowledge/mykad-emulator.md "Automation shape" for the full
   *  correction. */
  constructor(
    private readonly context: BrowserContext,
    opts: { wsUrl?: string; nric?: string; name?: string } = {},
  ) {
    this.wsUrl = opts.wsUrl ?? 'ws://localhost:7878/IDCard';
    const nric = opts.nric ?? CONFIG.mykadNric;
    const name = opts.name ?? CONFIG.mykadName;
    this.card = { ...CARD_FAIZUDDIN_AATF, NRIC: nric, GMPCName: name, OriginalName: name };
  }

  /** Sends `INSERTCARD:<json>` for this client's identity (NRIC/name
   *  injected at construction, everything else `CARD_FAIZUDDIN_AATF`'s
   *  values) and waits for the `SimulatorAck` ("INSERTCARD OK") — the same
   *  round trip the control panel's own "Insert Card" button performs. */
  async insertCard(timeoutMs = 15_000): Promise<void> {
    const page = await this.context.newPage();
    try {
      await page.goto('http://localhost:7878');
      const card = this.card;

      await page.evaluate((url) => {
        window.__mykadAcks = [];
        const ws = new WebSocket(url);
        ws.onmessage = (evt) => { window.__mykadAcks!.push(String(evt.data)); };
        window.__mykadWs = ws;
      }, this.wsUrl);
      await page.waitForFunction(() => window.__mykadWs?.readyState === WebSocket.OPEN, { timeout: 10_000 });

      const json = JSON.stringify(card);
      await page.evaluate((cardJson) => {
        window.__mykadAcks = [];
        window.__mykadWs!.send('INSERTCARD:' + cardJson);
      }, json);
      await page.waitForFunction(() => {
        return (window.__mykadAcks ?? []).some((raw) => {
          try { return JSON.parse(raw).Message === 'INSERTCARD OK'; } catch { return false; }
        });
      }, { timeout: timeoutMs });
    } finally {
      await page.close().catch(() => { /* ignore */ });
      // Recorded AFTER close — a page's video only finishes writing once
      // it's closed. This page's video would otherwise be silently dropped
      // by the dashboard's "just pick the newest .webm" logic (see
      // utils/videoManifest.ts's own doc comment) despite the emulator
      // hand-off being real evidence of the MyKad/thumbprint bypass.
      await recordSubPageVideo(page, 'mykad-emulator').catch(() => { /* ignore */ });
    }
  }

  /** No-op — kept so callers don't need to change. There is no longer a
   *  connection that outlives a single `insertCard()` call. */
  async close(): Promise<void> {}
}
