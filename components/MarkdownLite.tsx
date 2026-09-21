"use client";
import React from "react";

// A deliberately small Markdown renderer for the QA knowledge base — the
// project has no markdown dependency, and these files only use a fixed subset:
// headings, paragraphs, bullet/numbered lists, tables, fenced code, inline
// code, bold and links.
//
// One special case beyond plain markdown: provenance tags are written as
// inline code like `[verified: path · symbol]`. Those render as badges rather
// than code spans, colour-coded by kind, so a fact's source is visible at a
// glance and an [unconfirmed] entry can't be mistaken for an established one.

const TAG_RE = /^\[(verified|from ticket|unconfirmed)/i;

function tagStyle(text: string): string {
  const lower = text.toLowerCase();
  if (lower.startsWith("[unconfirmed")) return "bg-red-950/50 border-red-800/60 text-red-300";
  if (lower.startsWith("[from ticket")) return "bg-blue-950/50 border-blue-800/60 text-blue-300";
  if (lower.startsWith("[verified live")) return "bg-teal-950/50 border-teal-800/60 text-teal-300";
  return "bg-green-950/40 border-green-900/60 text-green-400";
}

const INLINE_RE = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [raw, code, bold, linkText, href] = m;

    if (code !== undefined) {
      if (TAG_RE.test(code)) {
        out.push(
          <span
            key={`${keyPrefix}-t${i}`}
            className={`inline-block align-baseline text-[10px] font-mono px-1.5 py-0.5 rounded border ${tagStyle(code)}`}
          >
            {code.replace(/^\[|\]$/g, "")}
          </span>
        );
      } else {
        out.push(
          <code key={`${keyPrefix}-c${i}`} className="text-[11px] font-mono px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {code}
          </code>
        );
      }
    } else if (bold !== undefined) {
      // Recurse: bold text often wraps an inline code span or a link
      // (**`getAttribute()` returns…**), and a flat pass would render the
      // inner backticks literally.
      out.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-slate-200">
          {renderInline(bold, `${keyPrefix}-b${i}`)}
        </strong>
      );
    } else if (linkText !== undefined) {
      const external = /^https?:\/\//.test(href ?? "");
      out.push(
        <a
          key={`${keyPrefix}-l${i}`}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30"
        >
          {linkText}
        </a>
      );
    } else {
      out.push(raw);
    }
    last = at + raw.length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const HEADING_CLASS: Record<number, string> = {
  1: "text-lg font-semibold text-slate-100 mt-1 mb-3",
  2: "text-sm font-semibold text-slate-100 mt-6 mb-2 pb-1.5 border-b border-slate-800",
  3: "text-xs font-semibold text-slate-200 uppercase tracking-wider mt-5 mb-2",
  4: "text-xs font-semibold text-slate-300 mt-4 mb-1.5",
};

export default function MarkdownLite({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank
    if (!line.trim()) { i++; continue; }

    // Fenced code. The fence may be indented (e.g. a snippet nested under a
    // list item), so strip the block's common indent instead of rendering it
    // with the markdown's own leading whitespace baked in.
    if (line.trimStart().startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) body.push(lines[i++]);
      i++; // closing fence
      const indent = Math.min(
        ...body.filter(l => l.trim()).map(l => l.match(/^\s*/)?.[0].length ?? 0),
        Infinity,
      );
      const dedented = Number.isFinite(indent) && indent > 0
        ? body.map(l => l.slice(indent))
        : body;
      blocks.push(
        <pre key={key++} className="my-3 p-3 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto">
          <code className="text-[11px] font-mono text-slate-400 leading-relaxed whitespace-pre">{dedented.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const Tag = (`h${level}`) as "h1" | "h2" | "h3" | "h4";
      blocks.push(
        <Tag key={key++} className={HEADING_CLASS[level]}>{renderInline(heading[2], `h${key}`)}</Tag>
      );
      i++;
      continue;
    }

    // Table — a pipe row followed by a |---|---| separator
    if (line.trimStart().startsWith("|") && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const header = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) rows.push(cells(lines[i++]));
      blocks.push(
        <div key={key++} className="my-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {header.map((h, hi) => (
                  <th key={hi} className="text-left font-semibold text-slate-300 border-b border-slate-700 px-2.5 py-1.5 whitespace-nowrap">
                    {renderInline(h, `th${key}-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-slate-800/70">
                  {r.map((c, ci) => (
                    <td key={ci} className="align-top text-slate-400 px-2.5 py-1.5 leading-relaxed">
                      {renderInline(c, `td${key}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Lists — bullets (-, *) and numbered (1.). Wrapped continuation lines are
    // indented, so they fold back into the item they belong to.
    const bullet = /^(\s*)([-*])\s+(.*)$/;
    const numbered = /^(\s*)(\d+)\.\s+(.*)$/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = !bullet.test(line) && numbered.test(line);
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(ordered ? numbered : bullet);
        if (m) {
          items.push(m[3]);
          i++;
        } else if (lines[i].trimStart().startsWith("```")) {
          // An indented fence under a list item: end the list so the block
          // loop renders it as code, rather than folding ``` into the text.
          break;
        } else if (items.length && /^\s+\S/.test(lines[i])) {
          items[items.length - 1] += " " + lines[i].trim(); // continuation
          i++;
        } else break;
      }
      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag key={key++} className="my-2 space-y-1.5 pl-1">
          {items.map((it, ii) => (
            <li key={ii} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
              <span className="text-slate-600 shrink-0 select-none">{ordered ? `${ii + 1}.` : "•"}</span>
              <span className="min-w-0">{renderInline(it, `li${key}-${ii}`)}</span>
            </li>
          ))}
        </ListTag>
      );
      continue;
    }

    // Paragraph — consecutive plain lines
    const para: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !lines[i].trimStart().startsWith("```") &&
      !lines[i].trimStart().startsWith("|") &&
      !bullet.test(lines[i]) && !numbered.test(lines[i])
    ) para.push(lines[i++]);
    blocks.push(
      <p key={key++} className="my-2 text-xs text-slate-400 leading-relaxed">
        {renderInline(para.join(" "), `p${key}`)}
      </p>
    );
  }

  return <div>{blocks}</div>;
}
