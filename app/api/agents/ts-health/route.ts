// GET /api/agents/ts-health[?refresh=1] — can every QA Team test-script
// workbook in the synced folder be read? (Faizuddin, 2026-10-27: after 7
// cloud-only, long-path workbooks silently blocked the Scribe.) Opens each
// file and checks its first bytes are a real .xlsx (zip) — opening also makes
// OneDrive download a cloud-only file. Cached for 30 minutes in
// data/agents/ts-health.json.
import * as fs from "node:fs";
import * as path from "node:path";
import { listWorkbooks, isStudyableWorkbook } from "@/scripts/pipeline/lib/xlsx-text.mjs";

export const dynamic = "force-dynamic";

const AGENTS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "agents");
const CACHE = path.join(AGENTS_DIR, "ts-health.json");
const MAX_AGE_MS = 30 * 60 * 1000;

interface Health {
  dir: string | null;
  total: number;
  readable: number;
  problems: { rel: string; reason: string }[];
  checkedAt: string;
}

function readJson<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(file, "utf8")) as T; } catch { return null; }
}

/** Plain-words reason a workbook cannot be read. */
function reasonFor(file: string, err: unknown): string {
  const e = err as NodeJS.ErrnoException;
  const long = file.length > 259 ? ` Path is ${file.length} characters.` : "";
  if (e?.code === "UNKNOWN" || e?.code === "EIO" || /unknown error, read/i.test(String(e?.message)))
    return `OneDrive has not downloaded it (cloud-only).${long} Right-click it → Always keep on this device.`;
  if (e?.code === "EBUSY" || e?.code === "EPERM") return "Locked by another program (for example open in Excel). Close it and check again.";
  if (e?.code === "ENOENT") return "Missing — it was moved or deleted while checking.";
  return String(e?.message ?? err).slice(0, 160);
}

async function check(file: string): Promise<string | null> {
  let fh: fs.promises.FileHandle | null = null;
  try {
    fh = await fs.promises.open(file, "r");
    const buf = Buffer.alloc(4);
    await fh.read(buf, 0, 4, 0);
    return buf[0] === 0x50 && buf[1] === 0x4b ? null : "Not a valid .xlsx file (it may be damaged or still downloading).";
  } catch (e) {
    return reasonFor(file, e);
  } finally {
    await fh?.close().catch(() => {});
  }
}

async function run(): Promise<Health> {
  const setup = readJson<{ sharepointDir?: string }>(path.join(AGENTS_DIR, "setup.json"));
  const dir = typeof setup?.sharepointDir === "string" ? setup.sharepointDir : null;
  const checkedAt = new Date().toISOString();
  if (!dir) return { dir: null, total: 0, readable: 0, problems: [], checkedAt };
  const files = (listWorkbooks(dir) as { path: string; rel: string }[]).filter(f => isStudyableWorkbook(f.rel));
  const problems: Health["problems"] = [];
  // A few at a time: each open may make OneDrive download a file.
  for (let i = 0; i < files.length; i += 8) {
    const batch = files.slice(i, i + 8);
    const results = await Promise.all(batch.map(f => check(f.path)));
    results.forEach((r, j) => { if (r) problems.push({ rel: batch[j].rel, reason: r }); });
  }
  const health = { dir, total: files.length, readable: files.length - problems.length, problems, checkedAt };
  try { fs.mkdirSync(AGENTS_DIR, { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify(health, null, 2)); } catch { /* cache is optional */ }
  return health;
}

export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  const cached = readJson<Health>(CACHE);
  if (!refresh && cached && Date.now() - Date.parse(cached.checkedAt) < MAX_AGE_MS) return Response.json(cached);
  return Response.json(await run());
}
