// GET /api/pipeline/ts-results?key=EAINT-9805[&since=<mtimeMs>]
// Live Pass / Fail count of the ticket's official TS (the OneDrive-synced
// copy in files.officialTs). Read only. With `since` equal to the file's
// current mtime the reply is just { unchanged: true } — the page polls this
// every few seconds, so only a real change re-reads the workbook.
// Faizuddin, 2026-11-03. Reader: lib/officialTsResults.ts.
import { readTicket, KEY_RE } from "@/scripts/pipeline/store.mjs";
import { officialTsStamp, readOfficialTsResults } from "@/lib/officialTsResults";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key")?.trim().toUpperCase() ?? "";
  if (!KEY_RE.test(key)) return Response.json({ error: "Give a ticket key, e.g. EAINT-9805." }, { status: 400 });
  const file = readTicket(key)?.files?.officialTs;
  if (!file) return Response.json({ error: "This ticket has no official TS file set." }, { status: 404 });

  const stamp = officialTsStamp(file);
  if (!stamp) return Response.json({ error: "The official TS file was not found in the OneDrive folder." }, { status: 404 });
  const since = Number(url.searchParams.get("since"));
  if (since && since === stamp.mtimeMs) return Response.json({ unchanged: true, mtimeMs: stamp.mtimeMs });

  try {
    return Response.json(await readOfficialTsResults(file));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // OneDrive can hold the file for a moment while it downloads a new version.
    const busy = /EBUSY|EPERM|EACCES/.test(msg);
    return Response.json(
      { error: busy ? "OneDrive is updating the file. Trying again shortly." : `Could not read the official TS: ${msg}`, retry: busy },
      { status: busy ? 503 : 500 },
    );
  }
}
