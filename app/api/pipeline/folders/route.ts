// Ticket folders outside the repo (Faizuddin, 2026-10-29: "i find it hard to
// open files here in this repo").
//   GET  ?key=<KEY>                       → { mine: { dir, exists } | null, qa: { dir, existed } | { error } }
//   POST { key, action: "open-mine" }     → opens his OneDrive "eAuto Documents/<KEY>" folder in File Explorer (made if missing)
//   POST { key, action: "open-qa" }       → opens the ticket's folder in the synced QA Team folder (only if it exists)
//   POST { key, action: "copy-to-qa" }    → copies Elf's TS workbook into the QA Team folder (the Elf button; never automatic)
import * as fs from "node:fs";
import { spawn } from "node:child_process";
import { KEY_RE, readTicket, updateTicket, appendChat, nowIso } from "@/scripts/pipeline/store.mjs";
import { myDocsAvailable, myTicketDir, ensureMyTicketDir } from "@/scripts/pipeline/lib/my-folder.mjs";
import { qaTicketDir, copyWorkbookToQa } from "@/scripts/pipeline/lib/qa-folder.mjs";

function openInExplorer(dir: string) {
  spawn("explorer.exe", [dir], { detached: true, stdio: "ignore", windowsHide: false }).unref();
}

export async function GET(request: Request) {
  const key = (new URL(request.url).searchParams.get("key") ?? "").trim().toUpperCase();
  if (!KEY_RE.test(key)) return Response.json({ error: "Not a ticket key" }, { status: 400 });
  const ticket = readTicket(key);
  const mine = myDocsAvailable() ? { dir: myTicketDir(key), exists: fs.existsSync(myTicketDir(key)) } : null;
  return Response.json({ mine, qa: qaTicketDir(key, ticket?.title) });
}

export async function POST(request: Request) {
  let body: { key?: unknown; action?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Body must be JSON: { key, action }" }, { status: 400 }); }
  const key = String(body?.key ?? "").trim().toUpperCase();
  if (!KEY_RE.test(key)) return Response.json({ error: "Not a ticket key" }, { status: 400 });
  const ticket = readTicket(key);
  if (!ticket) return Response.json({ error: `${key} is not in the pipeline` }, { status: 404 });

  switch (body.action) {
    case "open-mine": {
      const dir = ensureMyTicketDir(key);
      if (!dir) return Response.json({ error: "OneDrive is not set up on this PC." }, { status: 409 });
      openInExplorer(dir);
      return Response.json({ dir });
    }
    case "open-qa": {
      const where = qaTicketDir(key, ticket.title);
      if (where.error) return Response.json({ error: where.error }, { status: 409 });
      if (!where.existed || !where.dir) return Response.json({ error: "This ticket has no folder in the QA Team folder yet." }, { status: 404 });
      openInExplorer(where.dir);
      return Response.json({ dir: where.dir });
    }
    case "copy-to-qa": {
      let r: ReturnType<typeof copyWorkbookToQa>;
      try { r = copyWorkbookToQa(ticket); }
      catch (e) { return Response.json({ error: (e as Error).message }, { status: 500 }); }
      if (r.error || !r.file) return Response.json({ error: r.error ?? "Not copied" }, { status: 409 });
      const file = r.file;
      updateTicket(key, t => {
        t.files = { ...t.files, qaWorkbook: file };
        t.events = [{ at: nowIso(), text: "Faizuddin put the TS workbook in the QA Team folder" }, ...(t.events ?? [])].slice(0, 100);
      });
      appendChat(key, "elf", { from: "system", text: `1. Workbook put in the QA Team folder${r.folderExisted ? "" : " (new ticket folder)"}: **${file}**` });
      return Response.json({ file, folderExisted: r.folderExisted });
    }
    default:
      return Response.json({ error: "action must be open-mine, open-qa or copy-to-qa" }, { status: 400 });
  }
}
