// POST /api/agents/run { id } — start one study agent now, outside its
// schedule. Spawns the runner detached so it outlives this request.
import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";
import { AGENT_IDS, type AgentId } from "@/lib/agentStatus";

const RUNNER = path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts", "agents", "run-agent.mjs");

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Body must be JSON: { id }" }, { status: 400 }); }

  const id = (body as { id?: unknown } | null)?.id;
  if (typeof id !== "string" || !AGENT_IDS.includes(id as AgentId)) {
    return Response.json({ error: `Unknown agent. Use one of: ${AGENT_IDS.join(", ")}` }, { status: 400 });
  }
  if (!fs.existsSync(RUNNER)) {
    return Response.json(
      { error: "The agent runner (scripts/agents/run-agent.mjs) is not installed yet." },
      { status: 409 },
    );
  }

  try {
    const child = spawn(process.execPath, [RUNNER, id, "--force"], {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("error", () => { /* reported through the status file, if at all */ });
    child.unref();
  } catch (e) {
    return Response.json({ error: `Could not start the agent: ${(e as Error).message}` }, { status: 500 });
  }
  return Response.json({ started: true });
}
