// Staging environments that automation must not run on. proxy.ts checks every
// automation run request against this list and rejects a match with HTTP 403,
// so every current and future run route is covered without its own check.
//
// Source: Teams notice pasted by Faizuddin, 2026-10-26:
//   "dev (WeiTing) has changed the Wholesale UAT server to point to
//    staging/uat3 (previously staging/sit2). Staging/sit4 will remain as the
//    Wholesale dev testing and SIT environment."
//   "please try NOT to use the following environments for non-Wholesale CRs,
//    as both will be reserved for Wholesale-related CRs ya: staging/sit4
//    staging/uat3"
// To release an environment, remove its line here.

export interface ReservedEnv {
  /** Instance segment as it appears in staging.eauto.my/<segment>. */
  segment: string;
  reason: string;
}

export const RESERVED_ENVIRONMENTS: ReservedEnv[] = [
  { segment: "sit4", reason: "Wholesale dev testing and SIT environment" },
  { segment: "uat3", reason: "Wholesale UAT server since 2026-10-26, previously staging/sit2" },
];

/**
 * The reserved environment a value points at, or null. Matches a staging URL
 * (https://staging.eauto.my/uat3/...), "staging/uat3", "/uat3", or the bare
 * segment ("uat3", any case). Free text that only mentions it is not matched.
 */
export function reservedEnvIn(value: string): ReservedEnv | null {
  const v = value.trim().toLowerCase();
  if (!v || v.length > 2000) return null;
  for (const env of RESERVED_ENVIRONMENTS) {
    const s = env.segment;
    if (v === s || v === `/${s}` || v === `staging/${s}` || v === `staging/${s}/`) return env;
    if (new RegExp(`staging\\.eauto\\.my/${s}(?:[/?#]|$)`).test(v)) return env;
    if (new RegExp(`(?:^|[\\s(])staging/${s}(?:[/\\s)]|$)`).test(v)) return env;
  }
  return null;
}

/** Walks a parsed JSON body and returns the first reserved environment found in any string value. */
export function reservedEnvInBody(body: unknown, depth = 0): ReservedEnv | null {
  if (depth > 8 || body == null) return null;
  if (typeof body === "string") return reservedEnvIn(body);
  if (Array.isArray(body)) {
    for (const x of body) { const hit = reservedEnvInBody(x, depth + 1); if (hit) return hit; }
    return null;
  }
  if (typeof body === "object") {
    for (const x of Object.values(body as Record<string, unknown>)) { const hit = reservedEnvInBody(x, depth + 1); if (hit) return hit; }
  }
  return null;
}

export function reservedEnvMessage(env: ReservedEnv): string {
  return `Blocked: staging/${env.segment} is reserved for Wholesale CRs (${env.reason}). Pick another environment. Source: Teams notice, 2026-10-26.`;
}
