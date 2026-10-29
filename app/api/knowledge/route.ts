import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Serves the repo's QA knowledge base (knowledge/*.md) to the Knowledge Base
// page for reading and editing. The files are the source of truth — the AI
// assistant reads them straight off disk, so an edit here changes what it
// knows on the next session.

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");

/** Only bare .md filenames — no directories, no traversal, no other extensions. */
const NAME_RE = /^[A-Za-z0-9._-]+\.md$/;

/**
 * Resolve a requested filename to an absolute path inside KNOWLEDGE_DIR, or
 * null if it isn't a plain .md name that already exists there. Both checks
 * matter: the regex rejects "../" style input, and the realpath comparison
 * catches anything that still escapes (e.g. a symlink pointing outside).
 */
function resolveExisting(name: string): string | null {
  if (!NAME_RE.test(name)) return null;
  const full = path.join(KNOWLEDGE_DIR, name);
  const rel = path.relative(KNOWLEDGE_DIR, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return full;
}

/** First "# Heading" in the file, falling back to the filename. */
function titleOf(content: string, name: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : name.replace(/\.md$/, "");
}

export async function GET(req: NextRequest) {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    return NextResponse.json({ error: "No knowledge/ directory found in the project." }, { status: 404 });
  }

  const requested = req.nextUrl.searchParams.get("file");

  // Single file
  if (requested) {
    const full = resolveExisting(requested);
    if (!full) return NextResponse.json({ error: "File not found." }, { status: 404 });
    const content = fs.readFileSync(full, "utf-8");
    return NextResponse.json({
      name: requested,
      title: titleOf(content, requested),
      content,
      updatedAt: fs.statSync(full).mtime.toISOString(),
    });
  }

  // Listing — README first, then alphabetical, so the index leads.
  const files = fs.readdirSync(KNOWLEDGE_DIR)
    .filter(n => NAME_RE.test(n))
    .sort((a, b) => {
      const aIdx = a.toLowerCase() === "readme.md";
      const bIdx = b.toLowerCase() === "readme.md";
      if (aIdx !== bIdx) return aIdx ? -1 : 1;
      return a.localeCompare(b);
    })
    .map(name => {
      const full = path.join(KNOWLEDGE_DIR, name);
      const content = fs.readFileSync(full, "utf-8");
      const stat = fs.statSync(full);
      return {
        name,
        title: titleOf(content, name),
        lines: content.split("\n").length,
        // How many facts carry a provenance tag — the health signal for this KB.
        tagged: (content.match(/\[(?:verified|from ticket|unconfirmed)[^\]]*\]/g) ?? []).length,
        updatedAt: stat.mtime.toISOString(),
      };
    });

  return NextResponse.json({ files });
}

export async function PUT(req: NextRequest) {
  let body: { file?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { file, content } = body;
  if (!file || typeof content !== "string") {
    return NextResponse.json({ error: "Both 'file' and 'content' are required." }, { status: 400 });
  }

  // Deliberately edit-only: the path must already exist. New areas should be
  // added as a reviewed change to the repo (and indexed in README.md), not
  // created ad hoc through the browser.
  const full = resolveExisting(file);
  if (!full) {
    return NextResponse.json({ error: "File not found — only existing knowledge files can be saved." }, { status: 404 });
  }

  try {
    fs.writeFileSync(full, content, "utf-8");
    return NextResponse.json({
      ok: true,
      name: file,
      updatedAt: fs.statSync(full).mtime.toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not write the file." },
      { status: 500 },
    );
  }
}
