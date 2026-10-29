// Blocks automation runs on reserved environments (lib/reservedEnvironments.ts).
// Runs before every automation POST, so new run routes are covered with no
// change of their own.
import { NextResponse, type NextRequest } from "next/server";
import { reservedEnvInBody, reservedEnvMessage } from "@/lib/reservedEnvironments";

/** Routes that start an automation or checker run against an eAuto / Secarang environment. */
const RUN_ROUTE = /^\/api\/(?:eauto[^/]*|insurance|secarang)(?:\/.*)?\/(?:run|check|regression|plate-check|find-data)\/?$/;

export async function proxy(req: NextRequest) {
  if (req.method !== "POST" || !RUN_ROUTE.test(req.nextUrl.pathname)) return NextResponse.next();
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return NextResponse.next();
  let body: unknown;
  try { body = await req.clone().json(); } catch { return NextResponse.next(); }
  const hit = reservedEnvInBody(body);
  if (!hit) return NextResponse.next();
  return NextResponse.json({ error: reservedEnvMessage(hit), reservedEnvironment: `staging/${hit.segment}` }, { status: 403 });
}

export const config = {
  matcher: "/api/:path*",
};
