/**
 * The Google Maps simulator that staging's wholesale-geo calls for eMOVE / Wholesale distances
 * (`https://stage-ws.eauto.my/esim/admin/google-maps`), and geo's own cache page (`/geo/dev/lookup`).
 *
 * Why: with no rule the stub answers EVERY route with 100 km, so every eMOVE prices at Tier 1
 * (EAINT-12019 smoke I1, 30.10.2026; `knowledge/_core/environments.md` "Google Maps simulator").
 * A test that needs a distance gives each address its own street name, and this helper writes a
 * geocode rule per street and a route rule between them, in OUR scenario only.
 *
 * Verified 30.10.2026 15:50 on /uat3/ by hand (scenario EAINT12019-azfar-lane1: 330 km → Step 2
 * "Distance 330 km", BO Pricing History TIER_2). Rows of other scenarios are never written: every
 * write checks the row's `scenario`, and the stub is shared (EAINT12019-uat3-qa, LOGI-004-*, …).
 *
 * Coordinates must be UNIQUE per point: the stub gets coordinates from geo and maps them back to an alias, so two of
 * our points on the same lat/lng answer with whichever alias comes first (verify r2, 30.10.2026: the V4 rule said
 * 150 km, geo got 330 km from the V3 / azqa-pick points on the same Shah Alam coordinates, even after clearing the
 * cache). `stubRoute` therefore moves each tag's points by a small offset derived from the tag.
 *
 * Cache: geo caches coordinates and routes. A brand-new street name is never cached; `clearCache` is for an address
 * whose rule was changed after a lookup (proven 30.10.2026: "Route cache rows deleted: 1", next lookup cached=false).
 */
import { request, type APIRequestContext } from "@playwright/test";

const BASE = "https://stage-ws.eauto.my";
/** Our scenario on the shared stub. Rules of any other scenario are read-only to us. */
export const MAPS_SCENARIO = "EAINT12019-azfar";

export interface StubPoint {
  /** Unique street text; the geocode rule matches an address that CONTAINS it (e.g. "Jalan AzQA P07"). */
  street: string;
  alias: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

/** Points by state, so the address a test types matches the state / town it picks. */
export const STUB_PLACES = {
  shahAlam: { lat: 3.0733, lng: 101.5185, town: "40000 Shah Alam, Selangor" },
  johorBahru: { lat: 1.4927, lng: 103.7414, town: "80000 Johor Bahru, Johor" },
  kualaLumpur: { lat: 3.139, lng: 101.6869, town: "50450 Kuala Lumpur" },
  penang: { lat: 5.4141, lng: 100.3288, town: "10000 George Town, Pulau Pinang" },
} as const;

export class MapsStub {
  private ctx?: APIRequestContext;

  async connect(): Promise<void> {
    this.ctx = await request.newContext({ baseURL: BASE, ignoreHTTPSErrors: true });
  }

  async close(): Promise<void> {
    await this.ctx?.dispose();
    this.ctx = undefined;
  }

  private api(path: string): string {
    return `/esim/api/google-maps/${path}`;
  }

  private async list(kind: "geocode-responses" | "route-responses"): Promise<any[]> {
    const r = await this.ctx!.get(this.api(kind));
    if (!r.ok()) throw new Error(`maps stub GET ${kind}: ${r.status()}`);
    return r.json();
  }

  /** The route the stub answers when no rule matches (100 km on staging, 30.10.2026). */
  async defaultRouteKm(): Promise<number> {
    const s: any[] = await (await this.ctx!.get(this.api("settings"))).json();
    return (s.find((x) => x.capability === "routing")?.defaultDistanceMeters ?? NaN) / 1000;
  }

  /** Create or update OUR geocode rule for `p.street`. Refuses a street someone else's rule already matches. */
  async ensurePoint(p: StubPoint): Promise<void> {
    const rows = await this.list("geocode-responses");
    const mine = rows.find((r) => r.alias === p.alias && r.scenario === MAPS_SCENARIO);
    const clash = rows.find((r) => r.scenario !== MAPS_SCENARIO && (r.alias === p.alias || String(r.matchValue ?? "").toLowerCase() === p.street.toLowerCase()));
    if (clash) throw new Error(`maps stub: "${p.street}" / ${p.alias} is already used by scenario ${clash.scenario}; pick another street.`);
    const body = {
      matchType: "contains", matchValue: p.street, alias: p.alias, matchTier: "exact", neighbourOffsetM: 120,
      status: "OK", lat: p.lat, lng: p.lng, formattedAddress: p.formattedAddress, httpStatus: 200,
      scenario: MAPS_SCENARIO, delayMs: 0, enabled: true, priority: 50,
    };
    const r = mine
      ? await this.ctx!.put(this.api(`geocode-responses/${mine.id}`), { data: { ...mine, ...body } })
      : await this.ctx!.post(this.api("geocode-responses"), { data: body });
    if (!r.ok()) throw new Error(`maps stub geocode ${p.alias}: ${r.status()} ${(await r.text()).slice(0, 200)}`);
  }

  /** Create or update OUR route rule a → b (and b → a) with this distance. */
  async ensureRoute(fromAlias: string, toAlias: string, km: number): Promise<void> {
    const rows = await this.list("route-responses");
    for (const [a, b] of [[fromAlias, toAlias], [toAlias, fromAlias]]) {
      const mine = rows.find((r) => r.pickupAlias === a && r.dropoffAlias === b && r.scenario === MAPS_SCENARIO);
      const body = {
        matchType: "alias", pickupAlias: a, dropoffAlias: b, status: "OK", elementStatus: "OK",
        distanceMeters: Math.round(km * 1000), durationSeconds: 14000, httpStatus: 200,
        scenario: MAPS_SCENARIO, delayMs: 0, enabled: true, priority: 50,
      };
      const r = mine
        ? await this.ctx!.put(this.api(`route-responses/${mine.id}`), { data: { ...mine, ...body } })
        : await this.ctx!.post(this.api("route-responses"), { data: body });
      if (!r.ok()) throw new Error(`maps stub route ${a}>${b}: ${r.status()} ${(await r.text()).slice(0, 200)}`);
    }
  }

  /** Forget geo's cached coordinates + route for these two full addresses (the lookup page's "Clear both"). */
  async clearCache(pickupAddress: string, dropoffAddress: string): Promise<void> {
    const r = await this.ctx!.post("/geo/dev/lookup/clear", { form: { pickup: pickupAddress, dropoff: dropoffAddress, action: "both" } });
    if (!r.ok()) throw new Error(`geo cache clear: ${r.status()}`);
  }

  /** What geo answers now for the two addresses (the lookup page's "Look up"): road km, or NaN. */
  async lookupKm(pickupAddress: string, dropoffAddress: string): Promise<number> {
    const r = await this.ctx!.post("/geo/dev/lookup", { form: { pickup: pickupAddress, dropoff: dropoffAddress } });
    const m = /Road distance:\s*([\d.,]+)\s*km/.exec((await r.text()).replace(/<[^>]+>/g, " "));
    return m ? Number(m[1].replace(/,/g, "")) : NaN;
  }
}

/**
 * Give a route a distance on the stub for one test: two of OUR streets, a route between them.
 * Use a NEW tag for a new distance: geo caches the route of a tag's coordinates, so re-using a tag with another `km`
 * returns the old distance unless `MapsStub.clearCache` is called with the two full addresses eMOVE sent.
 * Returns the address lines to type on eMOVE Step 1 ("No 1 <street>, Taman Ujian").
 */
export async function stubRoute(opts: {
  tag: string;
  km: number;
  from?: keyof typeof STUB_PLACES;
  to?: keyof typeof STUB_PLACES;
}): Promise<{ pickupAddress: string; dropoffAddress: string; km: number }> {
  const from = STUB_PLACES[opts.from ?? "shahAlam"];
  const to = STUB_PLACES[opts.to ?? "johorBahru"];
  const t = opts.tag.replace(/[^A-Za-z0-9]/g, "");
  // a per-tag offset (about 0.1 - 2 km) so no two of our points share coordinates (see the note at the top)
  const h = [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  const off = 0.001 + (h % 200) * 0.0001;
  const ps = `Jalan AzQA ${t} P`, ds = `Jalan AzQA ${t} D`;
  const pLat = +(from.lat + off).toFixed(6), pLng = +(from.lng + off).toFixed(6);
  const stub = new MapsStub();
  await stub.connect();
  try {
    await stub.ensurePoint({ street: ps, alias: `azqa-${t.toLowerCase()}-p`, lat: pLat, lng: pLng, formattedAddress: `No 1, ${ps}, ${from.town}` });
    // Drop-off point at a believable straight line for the road km (road ≈ 1.25 × straight), due east of the pick-up:
    // geo flags a road shorter than ~1.09 × the straight line as IMPLAUSIBLE (verify r5: a 150 km rule between points
    // 303 km apart priced at 100 km on eMOVE). The point's formatted address keeps the chosen town; only the
    // coordinates move.
    const dLng = opts.km / 1.25 / (111.32 * Math.cos((pLat * Math.PI) / 180));
    await stub.ensurePoint({ street: ds, alias: `azqa-${t.toLowerCase()}-d`, lat: pLat, lng: +(pLng + Math.max(dLng, 0.001)).toFixed(6), formattedAddress: `No 2, ${ds}, ${to.town}` });
    await stub.ensureRoute(`azqa-${t.toLowerCase()}-p`, `azqa-${t.toLowerCase()}-d`, opts.km);
  } finally {
    await stub.close();
  }
  return { pickupAddress: `No 1 ${ps}, Taman Ujian`, dropoffAddress: `No 2 ${ds}, Taman Ujian`, km: opts.km };
}
