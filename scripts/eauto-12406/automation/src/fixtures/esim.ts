/**
 * eSim client — the JPJ / RHB response simulator.
 *
 * eSim decides what JPJ and RHB return to eAuto. Its records are keyed by the
 * FIRST CHARACTERS OF THE VEHICLE NUMBER (`vnStartWith`), so the prefix of the
 * vehicle number a test generates is what selects the outcome.
 *
 * Uses eSim's REST API, not its screens. It is a JHipster app:
 *
 *   POST /esim/api/authenticate      { username, password } -> { id_token }
 *   GET  /esim/api/<entity>s         list
 *   GET  /esim/api/<entity>s/<id>    one
 *   POST /esim/api/<entity>s         create
 *   PUT  /esim/api/<entity>s/<id>    update
 *
 * Note the plural: the UI route is `stms-enquiry-resp`, the API is
 * `stms-enquiry-resps`. `ESIM_ENTITY` holds the UI names and `apiPath()`
 * pluralises, so callers use one vocabulary.
 *
 * Deliberately generic over entity, so the same client serves STMS today and
 * Dereg, RHB, LKM, BMK, Insurance, JomCheck, SSM or OTH on the next ticket.
 *
 * Confirmed against staging on 2026-09-15.
 *
 * WARNING — `<entity>.json` on the UI routes answers with Content-Type
 * `application/json` but an HTML body. Do not trust it; use this client.
 */

import { request, type APIRequestContext } from "@playwright/test";

/** eSim's UI route names, from its own navigation. */
/*
 * Corrected 2026-09-22 against the live eSim menu, which is the only place the
 * real names appear: `estmCancel` was `estm-cancel-resp` and 404s — the entity
 * is `estm-cancel-submission-resp`. Eight entities were missing entirely,
 * including all three SSM submission tables.
 *
 * To re-derive: sign in to eSim and read the nav — every item's href IS the
 * entity path. Guessing does not work; six plausible SSM names all 404'd.
 */
export const ESIM_ENTITY = {
  stmsEnquiry: "stms-enquiry-resp",
  stmsSubmission: "stms-submission-resp",
  estmEnquiry: "estm-enquiry-resp",
  estmSubmission: "estm-submission-resp",
  estmCancel: "estm-cancel-submission-resp",
  aptSubmission: "apt-submission-resp",
  deregEnquiry: "dereg-enquiry-resp",
  deregSubmission: "dereg-submission-resp",
  deregDecomposition: "dereg-decomposition-resp",
  deregPrecheck: "dereg-precheck-enquiry-resp",
  rhbEnquiry: "rhb-enquiry-resp",
  rhbTransfer: "rhb-transfer-resp",
  rhbAccountInfo: "rhb-account-info",
  serviceHub: "service-hub-resp",
  lkmEnquiry: "lkm-enquiry-resp",
  lkmSubmission: "lkm-submission-resp",
  bmkEnquiry: "bmk-enquiry-resp",
  bmkSubmission: "bmk-submission-resp",
  insuranceApi: "insurance-api-resp",
  jomcheckEnquiry: "jomcheck-enquiry-resp",
  jomcheckReport: "jomcheck-report-resp",
  lkmRefundOcr: "lkm-refund-ocr-document-resp",
  lkmRefundInquiry: "lkm-refund-inquiry-resp",
  insuranceQuotation: "insurance-quotation-control",
  boldPay: "bold-pay-response",
  ssmEnquiry: "ssm-enquiry-resp",
  ssmRobSubmission: "ssm-rob-submission-resp",
  ssmRocSubmission: "ssm-roc-submission-resp",
  ssmLlpSubmission: "ssm-llp-submission-resp",
  othEnquiry: "oth-enquiry-resp",
  othSubmission: "oth-submission-resp",
} as const;
export type EsimEntity = (typeof ESIM_ENTITY)[keyof typeof ESIM_ENTITY] | (string & {});

export interface EsimRecord {
  id?: number;
  vnStartWith?: string;
  responseCode?: string;
  [key: string]: unknown;
}

/** UI route -> API route. */
export function apiPath(entity: EsimEntity): string {
  return `api/${entity}s`;
}


/**
 * Prefixes other people's runs depend on. **Writing to these is refused.**
 *
 * Jin Siang Boo, Teams, 17 Sep 2026, answering "any setting on esim cannot
 * change?": *"I think dont touch the RHB Transfer response for these vehicle
 * prefix should be good"* — TT, WZ, AA, SA, MC, QS, WT, PC.
 *
 * eSim is shared mutable state: one edit changes what JPJ or RHB returns for
 * everyone testing that prefix, and the damage is silent — the next person's
 * run just behaves differently. A list in a chat message protects nobody, so
 * the client enforces it.
 *
 * Matching is by PREFIX in both directions, because eSim itself matches by
 * "starts with": writing "TTX" would shadow "TT", and writing "T" would
 * swallow it.
 */
export const PROTECTED_PREFIXES = ["TT", "WZ", "AA", "SA", "MC", "QS", "WT", "PC"] as const;

/** Entities where the protected list applies. RHB Transfer is the one named. */
export const PROTECTED_ENTITIES: readonly string[] = [
  "rhb-transfer-resp",
];

function assertWritable(entity: EsimEntity, prefix: string | undefined): void {
  if (!prefix) return;
  if (!PROTECTED_ENTITIES.includes(String(entity))) return;

  const p = prefix.toUpperCase();
  const clash = PROTECTED_PREFIXES.find((q) => p.startsWith(q) || q.startsWith(p));
  if (clash) {
    throw new Error(
      `Refusing to write ${entity} prefix "${prefix}": it collides with the protected prefix ` +
        `"${clash}". Other people's runs depend on these RHB Transfer responses ` +
        `(Jin Siang Boo, 17 Sep 2026). Pick a prefix outside ${PROTECTED_PREFIXES.join(", ")}, ` +
        `or get it agreed in the eAuto QAs chat first.`,
    );
  }
}

export class EsimClient {
  private ctx?: APIRequestContext;
  private token?: string;
  private readonly baseURL: string;

  constructor(baseURL = process.env.ESIM_BASE_URL) {
    if (!baseURL) throw new Error("ESIM_BASE_URL is not set — fill automation/.env.");
    this.baseURL = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
  }

  /**
   * Authenticate. eSim sits on an internal address, so this fails without the
   * VPN — the error says so rather than surfacing a bare timeout.
   */
  async connect(
    username = process.env.ESIM_USERNAME,
    password = process.env.ESIM_PASSWORD,
  ): Promise<void> {
    if (!username || !password) {
      throw new Error("ESIM_USERNAME and ESIM_PASSWORD must be set in automation/.env.");
    }
    this.ctx = await request.newContext({ baseURL: this.baseURL, ignoreHTTPSErrors: true });

    const res = await this.ctx
      .post("api/authenticate", {
        data: { username, password, rememberMe: true },
        headers: { "Content-Type": "application/json" },
      })
      .catch(() => null);

    if (!res) throw new Error(`Could not reach eSim at ${this.baseURL}. Is the VPN connected?`);
    if (!res.ok()) throw new Error(`eSim authentication failed with ${res.status()}.`);

    this.token = ((await res.json()) as { id_token: string }).id_token;
  }

  private get auth(): Record<string, string> {
    if (!this.ctx || !this.token) throw new Error("EsimClient is not connected. Call connect() first.");
    return { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" };
  }

  /** Every record for an entity. */
  async list(entity: EsimEntity): Promise<EsimRecord[]> {
    const res = await this.ctx!.get(apiPath(entity), { headers: this.auth });
    if (!res.ok()) throw new Error(`eSim list ${entity} failed with ${res.status()}.`);
    return (await res.json()) as EsimRecord[];
  }

  /**
   * The record governing a vehicle-number prefix, or null.
   *
   * Matching is exact on `vnStartWith`. eSim itself matches by prefix, so two
   * records with overlapping prefixes ("TE" and "TES") are ambiguous — a data
   * problem to fix in eSim, not something to paper over here.
   */
  async findByPrefix(entity: EsimEntity, prefix: string): Promise<EsimRecord | null> {
    const rows = await this.list(entity);
    return rows.find((r) => String(r.vnStartWith ?? "").toUpperCase() === prefix.toUpperCase()) ?? null;
  }

  async create(entity: EsimEntity, record: EsimRecord): Promise<EsimRecord> {
    assertWritable(entity, record.vnStartWith);
    const res = await this.ctx!.post(apiPath(entity), { headers: this.auth, data: record });
    if (!res.ok()) {
      throw new Error(`eSim create ${entity} failed with ${res.status()}: ${(await res.text()).slice(0, 200)}`);
    }
    return (await res.json()) as EsimRecord;
  }

  async update(entity: EsimEntity, record: EsimRecord & { id: number }): Promise<EsimRecord> {
    assertWritable(entity, record.vnStartWith);
    const res = await this.ctx!.put(`${apiPath(entity)}/${record.id}`, {
      headers: this.auth,
      data: record,
    });
    if (!res.ok()) {
      throw new Error(`eSim update ${entity}/${record.id} failed with ${res.status()}: ${(await res.text()).slice(0, 200)}`);
    }
    return (await res.json()) as EsimRecord;
  }

  /**
   * Delete a row THIS SUITE seeded — and nothing else.
   *
   * Only for undoing a half-written seed. The guard is the marker every seeded
   * row carries in `remark` (see `SEED_REMARK` in `src/data/ssm-seed.ts`): a
   * row without it belongs to someone else, and a shared simulator is not a
   * place to tidy up other people's data.
   */
  async removeSeeded(entity: EsimEntity, record: EsimRecord): Promise<void> {
    if (record.id === undefined || !String(record.remark ?? "").startsWith("Azfar - QA automation")) {
      throw new Error(`Refusing to delete ${entity}/${record.id}: not a row this suite seeded (remark "${record.remark}").`);
    }
    const res = await this.ctx!.delete(`${apiPath(entity)}/${record.id}`, { headers: this.auth });
    if (!res.ok()) throw new Error(`eSim delete ${entity}/${record.id} failed with ${res.status()}.`);
  }

  /**
   * Make a prefix map to the given values, creating the record if absent.
   *
   * This is the call a scenario should use. Prefer one record per outcome over
   * editing a shared record per run: editing mutates state other testers rely
   * on, and it makes two runs collide.
   */
  async ensurePrefix(
    entity: EsimEntity,
    prefix: string,
    fields: Omit<EsimRecord, "id" | "vnStartWith">,
  ): Promise<EsimRecord> {
    assertWritable(entity, prefix);
    const existing = await this.findByPrefix(entity, prefix);
    if (existing?.id !== undefined) {
      return this.update(entity, { ...existing, ...fields, id: existing.id, vnStartWith: prefix });
    }
    return this.create(entity, { vnStartWith: prefix, ...fields });
  }

  async close(): Promise<void> {
    await this.ctx?.dispose();
    this.ctx = undefined;
    this.token = undefined;
  }
}
