/**
 * MyKad Reader Emulator client.
 *
 * Drives the emulator over its WebSocket so a test never touches the emulator GUI.
 *
 * PROTOCOL — verified against the shipped server on 2026-09-15 by reading
 * `resources/app.asar -> vendor/scripts/server.js` inside
 * `MyKad-Reader-Emulator-1.0.0.exe`, and by a live round trip.
 * See `knowledge/_core/mykad-emulator.md` for the full command list.
 *
 * The two facts that make automation possible:
 *
 *  1. Card state is held PER CHANNEL, not per connection. The channel is the
 *     WebSocket path: `/IDCard` (default) or `/IDCard/ch0`, `/IDCard/ch1`, ...
 *     A second client on the same path shares state with the browser page.
 *
 *  2. When the page sends READCARD and no card is present, the server PARKS
 *     that request (`pendingReadCard`). The moment any client on that channel
 *     sends `INSERTCARD:<json>`, the server replays the full read sequence
 *     down the PARKED page's socket.
 *
 * So the test does: page clicks the thumbprint checkbox (page sends READCARD)
 * -> test calls insertCard() -> page receives Matching Result and unblocks.
 */

import WebSocket from "ws";
import type { BrowserContext } from "@playwright/test";

/**
 * The emulator channel of the run's lane (`LANE`, env/lanes.md): `lane1`, `lane2`, ... Lanes 3+ from 21.10.2026
 * midday, lanes 1-2 from the same evening. No LANE (a manual / ad-hoc run) keeps the default `/IDCard` channel,
 * which is also what Azfar's own browser and the Firefox 36 path use.
 *
 * eAuto's page hardcodes `ws://localhost:7878/IDCard`, so two runs at a card step at the same moment shared
 * one channel and could read each other's card. `routeMykadToLaneChannel` relays the page's socket to the
 * lane's own channel, and `MyKadClient` defaults to the same channel, so lanes 3+ never cross.
 */
export function laneMykadChannel(): string | undefined {
  const lane = Number(process.env.LANE || "");
  return Number.isInteger(lane) && lane >= 1 ? `lane${lane}` : undefined;
}

/**
 * Relay every eAuto page socket to `ws://localhost:7878/IDCard` in this context to `/IDCard/<channel>`
 * (Playwright routeWebSocket). Covers the pages of this context only: a spec that opens its own
 * `browser.newContext()` must call this on that context too. Not for the Firefox 36 (Selenium) path.
 */
const ROUTED = Symbol("mykadLaneRoute");

export async function routeMykadToLaneChannel(context: BrowserContext, channel: string, host = "ws://localhost:7878"): Promise<void> {
  const c = context as BrowserContext & { [ROUTED]?: boolean };
  if (c[ROUTED]) return;
  c[ROUTED] = true;
  await context.routeWebSocket(/^ws:\/\/localhost:7878\/IDCard(?:\?.*)?$/, (route) => {
    const url = route.url();
    const query = url.includes("?") ? url.slice(url.indexOf("?")) : "";
    const upstream = new WebSocket(`${host}/IDCard/${channel}${query}`);
    const pending: Array<string | Buffer> = [];
    upstream.on("open", () => { for (const m of pending.splice(0)) upstream.send(m); });
    upstream.on("message", (data, isBinary) => route.send(isBinary ? (data as Buffer) : data.toString()));
    upstream.on("close", () => { route.close().catch(() => undefined); });
    upstream.on("error", () => { route.close().catch(() => undefined); });
    route.onMessage((m) => { if (upstream.readyState === WebSocket.OPEN) upstream.send(m); else pending.push(m); });
    route.onClose(() => upstream.close());
  });
}

export type MatchResult = "Identical" | "Not Identical" | "Image quality too low";

export interface CardData {
  NRIC: string;
  GMPCName: string;
  OriginalName?: string;
  Gender?: string;
  DOB?: string;
  POB?: string;
  DateIssue?: string;
  Citizenship?: string;
  Race?: string;
  Religion?: string;
  Category?: string;
  Address1?: string;
  Address2?: string;
  Address3?: string;
  Postcode?: string;
  City?: string;
  State?: string;
  [key: string]: unknown;
}

export interface MyKadClientOptions {
  /**
   * The `wsPublicKey` the emulator wants on the query string.
   *
   * **Newer emulator builds REFUSE a connection without one** — every command
   * comes back `{"DataTitle":"Error","Message":"Public key empty."}` and the
   * socket stays open, so it looks like a hang rather than a rejection. Older
   * builds accepted a bare `/IDCard`, which is why this was not needed on
   * 2026-09-15 and was on 2026-09-18.
   *
   * Omit it and a fresh P-256 key is generated per connection. The emulator
   * only uses the key to derive the secret it signs replies with, and it keys
   * card state by CHANNEL (the URL path), not by key — so a generated key still
   * shares state with the browser page, which is the whole point.
   *
   * Set `MYKAD_WS_PUBLIC_KEY` to pin the portal's real key if the HMAC ever has
   * to match what eAuto expects.
   */
  publicKey?: string;
  /** Emulator host. Default ws://localhost:7878 */
  host?: string;
  /**
   * Channel id. `undefined` uses the default `/IDCard` path.
   * Pass "ch0", "ch1", ... to isolate parallel workers — but ONLY if the eAuto
   * page can be pointed at the same channel. See the note in README.
   */
  channel?: string;
  /** Milliseconds to wait for an ack before throwing. Default 5000. */
  timeoutMs?: number;
}

interface SimulatorMessage {
  DataTitle: string;
  Message?: string;
  Data?: unknown;
  HMAC?: string;
}

export class MyKadClient {
  private ws?: WebSocket;
  readonly url: string;
  private readonly timeoutMs: number;
  private readonly received: SimulatorMessage[] = [];
  private waiters: Array<{
    match: (m: SimulatorMessage) => boolean;
    resolve: (m: SimulatorMessage) => void;
    reject: (e: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];

  /** A DER SubjectPublicKeyInfo for P-256, hex, as the portal sends. */
  private static generatePublicKey(): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require("node:crypto") as typeof import("node:crypto");
    const { publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    return publicKey.export({ type: "spki", format: "der" }).toString("hex").toUpperCase();
  }

  constructor(opts: MyKadClientOptions = {}) {
    const host = opts.host ?? "ws://localhost:7878";
    const channel = opts.channel ?? laneMykadChannel(); // lanes 3+: the lane's own channel
    const path = channel ? `${host}/IDCard/${channel}` : `${host}/IDCard`;
    const key = opts.publicKey ?? process.env.MYKAD_WS_PUBLIC_KEY ?? MyKadClient.generatePublicKey();
    this.url = `${path}?wsPublicKey=${key}`;
    this.timeoutMs = opts.timeoutMs ?? 5000;
  }

  /** Connect and wait for the socket to open. */
  async connect(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.url);
      const timer = setTimeout(
        () => reject(new Error(`MyKad emulator did not accept a connection at ${this.url} within ${this.timeoutMs}ms. Is the emulator running?`)),
        this.timeoutMs,
      );
      ws.on("open", () => {
        clearTimeout(timer);
        this.ws = ws;
        resolve();
      });
      ws.on("error", (e) => {
        clearTimeout(timer);
        reject(new Error(`MyKad emulator connection failed (${this.url}): ${(e as Error).message}`));
      });
      ws.on("message", (raw) => this.onMessage(raw.toString()));
    });
  }

  private onMessage(raw: string): void {
    let msg: SimulatorMessage;
    try {
      msg = JSON.parse(raw) as SimulatorMessage;
    } catch {
      return; // the emulator only ever sends JSON; ignore anything else
    }
    this.received.push(msg);
    this.waiters = this.waiters.filter((w) => {
      if (!w.match(msg)) return true;
      clearTimeout(w.timer);
      w.resolve(msg);
      return false;
    });
  }

  private send(command: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("MyKad client is not connected. Call connect() first.");
    }
    this.ws.send(command);
  }

  private waitFor(
    match: (m: SimulatorMessage) => boolean,
    description: string,
  ): Promise<SimulatorMessage> {
    const already = this.received.find(match);
    if (already) return Promise.resolve(already);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timed out after ${this.timeoutMs}ms waiting for ${description} from the MyKad emulator.`)),
        this.timeoutMs,
      );
      this.waiters.push({ match, resolve, reject, timer });
    });
  }

  /**
   * Insert a virtual card on this channel.
   *
   * Fields you omit fall back to the emulator's own CARD_DEFAULTS, so a test
   * only has to state what it actually cares about.
   *
   * If the page has already parked a READCARD, this call is what releases it.
   */
  async insertCard(card: CardData): Promise<void> {
    const ack = this.waitFor(
      (m) => m.DataTitle === "SimulatorAck" && String(m.Message).startsWith("INSERTCARD"),
      "an INSERTCARD acknowledgement",
    );
    this.send(`INSERTCARD:${JSON.stringify(card)}`);
    const msg = await ack;
    if (!String(msg.Message).includes("OK")) {
      throw new Error(`Emulator rejected the card: ${msg.Message}`);
    }
  }

  /** Remove the card from this channel. Safe to call when no card is present. */
  async removeCard(): Promise<void> {
    const ack = this.waitFor(
      (m) => m.DataTitle === "SimulatorAck" && String(m.Message).startsWith("REMOVECARD"),
      "a REMOVECARD acknowledgement",
    );
    this.send("REMOVECARD");
    await ack;
  }

  /**
   * Set the fingerprint verification outcome for subsequent reads.
   *
   * This is how a negative thumbprint test is driven — there is no other way
   * to make verification fail without real hardware.
   */
  async setMatchResult(result: MatchResult): Promise<void> {
    const ack = this.waitFor(
      (m) => m.DataTitle === "SimulatorAck" && String(m.Message).startsWith("Config matchResult"),
      `confirmation that matchResult was set to "${result}"`,
    );
    this.send(`SET_MATCHRESULT__${result}`);
    await ack;
  }

  /** Clear card state, device metadata overrides and behaviour flags. */
  async resetAll(): Promise<void> {
    this.send("RESETALL");
  }

  /** Forget messages seen so far, so the next waitFor only matches new traffic. */
  clearHistory(): void {
    this.received.length = 0;
  }

  /** Everything the emulator has sent on this connection — useful in failure dumps. */
  transcript(): ReadonlyArray<SimulatorMessage> {
    return this.received;
  }

  async close(): Promise<void> {
    for (const w of this.waiters) clearTimeout(w.timer);
    this.waiters = [];
    this.ws?.close();
    this.ws = undefined;
  }
}
