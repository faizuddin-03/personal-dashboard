// POST /api/agents/jira-login — save the Jira login the study agents use
// (data/agents/jira.json, gitignored). DELETE removes it.
import * as fs from "node:fs";
import * as path from "node:path";

const AGENTS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "agents");
const JIRA_FILE = path.join(AGENTS_DIR, "jira.json");

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return Response.json({ error: "Body must be JSON" }, { status: 400 }); }

  const { baseUrl, email, apiToken, accountId } = body ?? {};
  const missing = (["baseUrl", "email", "apiToken"] as const).filter(k => !nonEmpty(body?.[k]));
  if (missing.length) {
    return Response.json({ error: `Missing: ${missing.join(", ")}` }, { status: 400 });
  }
  if (accountId !== undefined && accountId !== null && typeof accountId !== "string") {
    return Response.json({ error: "accountId must be a string" }, { status: 400 });
  }

  const data: Record<string, string> = {
    baseUrl: (baseUrl as string).trim().replace(/\/+$/, ""),
    email: (email as string).trim(),
    apiToken: (apiToken as string).trim(),
  };
  if (nonEmpty(accountId)) data.accountId = accountId.trim();

  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  fs.writeFileSync(JIRA_FILE, JSON.stringify(data, null, 2), "utf8");
  return Response.json({ saved: true });
}

export async function DELETE() {
  try { fs.rmSync(JIRA_FILE, { force: true }); }
  catch (e) { return Response.json({ error: (e as Error).message }, { status: 500 }); }
  return Response.json({ removed: true });
}
