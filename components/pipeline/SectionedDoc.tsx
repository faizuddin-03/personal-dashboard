"use client";
// Sectioned view of a pipeline markdown document (Faizuddin, 2026-10-27,
// verbatim: "can you make the display for the details in each tickets to be
// more sectioned, instead of just list of words. because too much lists and
// words also makes it hard for me to read").
//
// Used by app/pipeline/[key]/page.tsx only (Scout study, Scribe related
// history, Elf scenarios.md). components/MarkdownLite.tsx stays as it is for
// every other page. What it does with the markdown:
// 1. Each "## " heading is its own card with a title, a one-line summary and a
//    count; only the important ones start open (Header, What changes,
//    Estimated testing effort, questions / open points).
// 2. "### " headings become sub-cards inside their card.
// 3. A list of "**Label:** value" lines becomes a label / value grid; bold
//    words in a value show as small chips (status, dates, names).
// 4. Long lists show the first few items with "Show all"; long items fold.
// 5. A list item that is mostly a "quote" becomes a quote block with its
//    source as a small caption; [unconfirmed] / [from Teams ...] tags are pills.
// 6. Tables stay tables; "Estimated testing effort" gets number tiles.
// 7. kind="scenarios": each "**<id>_TSnn** — title" item is a TS card.
import { useState, type ReactNode } from "react";
import { ChevronDown, Quote, HelpCircle, ListChecks } from "lucide-react";
import clsx from "clsx";

/* ------------------------------------------------------------------ parse */

interface Item { text: string; kids: Item[]; kidsOrdered: boolean }
type Block =
  | { t: "p"; text: string }
  | { t: "list"; ordered: boolean; items: Item[] }
  | { t: "table"; header: string[]; rows: string[][] }
  | { t: "code"; text: string }
  | { t: "quote"; text: string }
  | { t: "h"; text: string };
interface Sub { title: string; blocks: Block[] }
interface Section { title: string; blocks: Block[]; subs: Sub[] }
interface Doc { title: string; preamble: Block[]; sections: Section[] }

const LIST_RE = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
const isTableRow = (l: string) => l.trimStart().startsWith("|");
const isSep = (l: string) => /^\s*\|[\s:|-]+\|\s*$/.test(l);

function parseBlocks(lines: string[]): Block[] {
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (line.trimStart().startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) body.push(lines[i++]);
      i++;
      out.push({ t: "code", text: body.join("\n") });
      continue;
    }

    if (/^#{3,6}\s/.test(line)) { out.push({ t: "h", text: line.replace(/^#+\s+/, "") }); i++; continue; }

    if (line.trimStart().startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) q.push(lines[i++].trimStart().replace(/^>\s?/, ""));
      out.push({ t: "quote", text: q.join(" ") });
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && isSep(lines[i + 1])) {
      const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const header = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
      out.push({ t: "table", header, rows });
      continue;
    }

    const lm = line.match(LIST_RE);
    if (lm) {
      const ordered = /\d/.test(lm[2]);
      const root: Item[] = [];
      const stack: { indent: number; items: Item[] }[] = [{ indent: lm[1].length, items: root }];
      let last: Item | null = null;
      while (i < lines.length) {
        const l = lines[i];
        const m = l.match(LIST_RE);
        if (m) {
          const indent = m[1].length;
          while (stack.length > 1 && indent < stack[stack.length - 1].indent) stack.pop();
          const top = stack[stack.length - 1];
          if (indent > top.indent && top.items.length) {
            const parent = top.items[top.items.length - 1];
            parent.kidsOrdered = /\d/.test(m[2]);
            stack.push({ indent, items: parent.kids });
          }
          last = { text: m[3], kids: [], kidsOrdered: true };
          stack[stack.length - 1].items.push(last);
          i++;
        } else if (!l.trim()) {
          // A blank line inside a list: keep going when the list continues.
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && LIST_RE.test(lines[j])) { i = j; continue; }
          break;
        } else if (last && /^\s+\S/.test(l) && !isTableRow(l) && !l.trimStart().startsWith("```")) {
          last.text += " " + l.trim();
          i++;
        } else break;
      }
      out.push({ t: "list", ordered, items: root });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length && lines[i].trim() && !/^#{1,6}\s/.test(lines[i]) && !lines[i].trimStart().startsWith("```") &&
      !(isTableRow(lines[i]) && i + 1 < lines.length && isSep(lines[i + 1])) && !LIST_RE.test(lines[i]) && !lines[i].trimStart().startsWith(">")
    ) para.push(lines[i++].trim());
    if (para.length) out.push({ t: "p", text: para.join(" ") });
    else i++;
  }
  return out;
}

function parseDoc(source: string): Doc {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let title = "";
  const pre: string[] = [];
  const secs: { title: string; lines: string[]; subs: { title: string; lines: string[] }[] }[] = [];
  for (const l of lines) {
    const h1 = l.match(/^#\s+(.*)$/);
    const h2 = l.match(/^##\s+(.*)$/);
    const h3 = l.match(/^###\s+(.*)$/);
    if (h1 && !secs.length && !title) { title = h1[1]; continue; }
    if (h2) { secs.push({ title: h2[1].trim(), lines: [], subs: [] }); continue; }
    const cur = secs[secs.length - 1];
    if (h3 && cur) { cur.subs.push({ title: h3[1].trim(), lines: [] }); continue; }
    if (!cur) { pre.push(l); continue; }
    if (cur.subs.length) cur.subs[cur.subs.length - 1].lines.push(l);
    else cur.lines.push(l);
  }
  return {
    title,
    preamble: parseBlocks(pre),
    sections: secs.map(s => ({ title: s.title, blocks: parseBlocks(s.lines), subs: s.subs.map(x => ({ title: x.title, blocks: parseBlocks(x.lines) })) })),
  };
}

/* ----------------------------------------------------------------- inline */

/** Plain text of a markdown line (for summaries and length checks). */
export function plain(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*|\+\+|!!/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SOURCE_TAG_RE = /^\[?(unconfirmed|from |verified|srd|teams|related|memory|charmain|jira|eaint-|source|scout|scribe|knowledge|flow-|_reference|data\/|ts |miro|qa portal|official)/i;

function pillClass(tag: string): string {
  const l = tag.toLowerCase();
  if (l.includes("unconfirmed")) return "bg-amber-500/10 border-amber-500/40 text-amber-300";
  if (l.includes("teams")) return "bg-violet-500/10 border-violet-500/35 text-violet-300";
  if (l.startsWith("verified")) return "bg-green-500/10 border-green-500/35 text-green-300";
  return "bg-slate-800 border-slate-700 text-slate-400";
}

function Pill({ text }: { text: string }) {
  return (
    <span className={clsx("inline-block align-baseline text-[10px] leading-4 px-1.5 rounded-full border mx-0.5 break-words", pillClass(text))}>
      {text.replace(/^\[|\]$/g, "")}
    </span>
  );
}

const INLINE_RE = /`([^`]+)`|\*\*(.+?)\*\*|\+\+(.+?)\+\+|!!(.+?)!!|\[([^\]]+)\]\(([^)\s]+)\)|\[([^\]\[]{2,160})\]|(?<=^|[\s(:—“])"([^"\s][^"]{23,}[^"\s])"(?=$|[\s),.;:—])/g;

/**
 * Inline markdown → React. `chips`: bold text shows as a small chip (used in
 * the label / value grid, where bold marks a status, date or name).
 */
export function Inline({ text, chips = false }: { text: string; chips?: boolean }) {
  return <>{renderInline(text, "i", chips)}</>;
}

function renderInline(text: string, kp: string, chips: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [raw, code, bold, green, red, linkText, href, bracket, quoted] = m;
    const k = `${kp}-${n++}`;
    if (code !== undefined) {
      if (code.startsWith("[")) out.push(<Pill key={k} text={code} />);
      else out.push(<code key={k} className="text-[11px] font-mono px-1 rounded bg-slate-800 border border-slate-700 text-slate-300 break-all">{code}</code>);
    } else if (bold !== undefined && /^\[[^\]]{1,60}\]$/.test(bold) && !SOURCE_TAG_RE.test(bold.slice(1))) {
      // A button name in a TS step, e.g. **[Submit]**.
      out.push(<span key={k} className="inline-block text-[11px] leading-5 px-1.5 rounded border border-slate-600 bg-slate-800 text-slate-100 font-medium">{bold.slice(1, -1)}</span>);
    } else if (bold !== undefined) {
      out.push(chips
        ? <span key={k} className="inline-block text-[11px] leading-5 px-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-200 mx-0.5">{renderInline(bold, k, false)}</span>
        : <strong key={k} className="font-semibold text-slate-100">{renderInline(bold, k, false)}</strong>);
    } else if (green !== undefined) {
      out.push(<span key={k} className="font-semibold text-green-300">{renderInline(green, k, false)}</span>);
    } else if (red !== undefined) {
      out.push(<span key={k} className="font-semibold text-red-300">{renderInline(red, k, false)}</span>);
    } else if (linkText !== undefined) {
      const ext = /^https?:\/\//.test(href ?? "");
      out.push(<a key={k} href={href} target={ext ? "_blank" : undefined} rel={ext ? "noreferrer" : undefined} className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 break-all">{linkText}</a>);
    } else if (bracket !== undefined) {
      if (SOURCE_TAG_RE.test(bracket)) out.push(<Pill key={k} text={bracket} />);
      else out.push(raw);
    } else if (quoted !== undefined) {
      out.push(<span key={k} className="text-slate-200 italic">&ldquo;{renderInline(quoted, k, false)}&rdquo;</span>);
    } else out.push(raw);
    last = at + raw.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ------------------------------------------------------------- small bits */

function ShowMore({ hidden, onClick, label }: { hidden: number; onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="mt-1 text-xs text-blue-400 hover:text-blue-300 hover:underline">
      {label ?? `Show ${hidden} more`}
    </button>
  );
}

/** Long text folds to three lines with a "Show more" toggle. */
function Fold({ text, chips, limit = 300, className }: { text: string; chips?: boolean; limit?: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = plain(text).length > limit;
  return (
    <div className={className}>
      <div className={clsx(long && !open && "line-clamp-3")}><Inline text={text} chips={chips} /></div>
      {long && (
        <button type="button" onClick={() => setOpen(o => !o)} className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline">
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- blocks */

const LEAD_RE = /^\*\*([^*]{1,100}?)\*\*\s*(:?)\s*(.*)$/;
/** "**Label:** value" or "**Label**: value". */
function factOf(text: string): { label: string; value: string } | null {
  const m = text.match(/^\*\*([^*]{1,60}?):\*\*\s*(.*)$/) ?? text.match(/^\*\*([^*]{1,60}?)\*\*:\s*(.*)$/);
  return m ? { label: m[1].trim(), value: m[2] } : null;
}
const isFactList = (items: Item[]) => items.length >= 2 && items.filter(it => factOf(it.text)).length / items.length >= 0.85;

const PEOPLE_RE = /^(ba|dev|developer|qa|qa pic|assignee|reporter|tester|owner|pic)\b/i;

function FactGrid({ items }: { items: Item[] }) {
  const [all, setAll] = useState(false);
  const LIMIT = 10;
  const shown = all ? items : items.slice(0, LIMIT);
  return (
    <div>
      <dl className="grid grid-cols-1 sm:grid-cols-[minmax(7rem,11rem)_1fr] gap-x-4 gap-y-1 sm:gap-y-2.5">
        {shown.map((it, i) => {
          const f = factOf(it.text);
          if (!f) {
            return <dd key={i} className="sm:col-span-2 text-[13px] text-slate-300 leading-relaxed"><Fold text={it.text} /></dd>;
          }
          let value = f.value;
          // A name at the start of a people row shows as a chip.
          if (PEOPLE_RE.test(f.label) && !value.startsWith("**")) {
            const nm = value.match(/^([^—(;,.]{2,40}?)(\s+[—(]|[;,.]|$)/);
            if (nm) value = `**${nm[1].trim()}**${value.slice(nm[1].length)}`;
          }
          return (
            <div key={i} className="contents">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500 pt-1 sm:pt-0.5 border-t border-slate-800/60 sm:border-0 first:border-0">{plain(f.label)}</dt>
              <dd className="text-[13px] text-slate-300 leading-relaxed min-w-0">
                <Fold text={value} chips limit={240} />
                {it.kids.length > 0 && <div className="mt-1"><ItemList items={it.kids} ordered={it.kidsOrdered} depth={1} /></div>}
              </dd>
            </div>
          );
        })}
      </dl>
      {items.length > LIMIT && <ShowMore hidden={items.length - LIMIT} onClick={() => setAll(a => !a)} label={all ? "Show less" : undefined} />}
    </div>
  );
}

/** An item that is mostly a quote: `[source]` "quote" — note. */
function quoteOf(text: string): { quote: string; caption: string } | null {
  // prefix (source / label, short) + one quote with no inner quotes + a short note after it.
  const m = text.match(/^(.*?)[“"]([^"“”]{20,})[”"]\s*([^"“”]*)$/);
  if (!m || plain(m[1]).length > 80) return null;
  const quote = m[2];
  if (quote.length < plain(text).length * 0.5) return null;
  return { quote, caption: [m[1].trim().replace(/\s*[—–:-]$/, ""), m[3].replace(/^[—–-]\s*/, "")].filter(Boolean).join(" — ") };
}

function QuoteBlock({ quote, caption }: { quote: string; caption?: string }) {
  return (
    <figure className="flex gap-2 rounded-lg border-l-2 border-blue-400/60 bg-blue-500/5 pl-3 pr-2 py-2">
      <Quote size={13} className="text-blue-400/70 shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0">
        <blockquote className="text-[13px] text-slate-200 leading-relaxed"><Fold text={quote} limit={360} /></blockquote>
        {caption && <figcaption className="mt-1 text-[11px] text-slate-500 leading-relaxed"><Inline text={caption} /></figcaption>}
      </div>
    </figure>
  );
}

function ItemBody({ it, depth }: { it: Item; depth: number }) {
  const q = quoteOf(it.text);
  const lead = !q ? it.text.match(LEAD_RE) : null;
  // "**Short title.** rest" or "**Label:** rest" → title line + text.
  const useLead = !!lead && plain(lead[1]).length <= 90 && (lead[3].length > 0 || it.kids.length > 0);
  return (
    <div className="min-w-0 flex-1">
      {q ? <QuoteBlock quote={q.quote} caption={q.caption} /> : useLead ? (
        <>
          <div className={clsx("font-semibold leading-snug", depth === 0 ? "text-[13px] text-slate-100" : "text-xs text-slate-200")}>
            <Inline text={lead![1] + (lead![2] ? ":" : "")} />
          </div>
          {lead![3] && <Fold text={lead![3]} className="text-[13px] text-slate-300 leading-relaxed mt-0.5" />}
        </>
      ) : (
        <Fold text={it.text} className={clsx("leading-relaxed", depth === 0 ? "text-[13px] text-slate-300" : "text-xs text-slate-300")} />
      )}
      {it.kids.length > 0 && (
        <div className="mt-1.5">
          {isFactList(it.kids) ? <FactGrid items={it.kids} /> : <ItemList items={it.kids} ordered={it.kidsOrdered} depth={depth + 1} />}
        </div>
      )}
    </div>
  );
}

function ItemList({ items, ordered, depth }: { items: Item[]; ordered: boolean; depth: number }) {
  const [all, setAll] = useState(false);
  const LIMIT = depth === 0 ? 6 : 5;
  // Show the whole list when only one or two would be hidden.
  const cut = items.length > LIMIT + 2 && !all;
  const shown = cut ? items.slice(0, LIMIT) : items;
  const cards = depth === 0;
  return (
    <div>
      <ol className={clsx(cards ? "space-y-2" : "space-y-1 border-l border-slate-800 pl-3")}>
        {shown.map((it, i) => (
          <li key={i} className={clsx("flex gap-2", cards && "rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2")}>
            <span className={clsx("shrink-0 select-none tabular-nums", cards ? "text-[11px] text-slate-500 w-5 pt-0.5" : "text-[11px] text-slate-600 w-4 pt-px")}>
              {ordered ? `${i + 1}.` : "•"}
            </span>
            <ItemBody it={it} depth={depth} />
          </li>
        ))}
      </ol>
      {items.length > LIMIT + 2 && <ShowMore hidden={items.length - LIMIT} onClick={() => setAll(a => !a)} label={all ? "Show less" : undefined} />}
    </div>
  );
}

function Table({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-slate-800/60">
          <tr>{header.map((h, i) => <th key={i} className="text-left font-semibold text-slate-200 px-2.5 py-1.5 align-bottom"><Inline text={h} /></th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-slate-800">
              {r.map((c, ci) => <td key={ci} className="align-top text-slate-300 px-2.5 py-1.5 leading-relaxed min-w-[6rem]"><Inline text={c} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Blocks({ blocks, scenarios }: { blocks: Block[]; scenarios?: { expandAll: boolean } }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p":
            return /^(sources?|basis|source file|captured)\b[^:]{0,20}:/i.test(plain(b.text))
              ? <p key={i} className="text-[11px] text-slate-500 leading-relaxed"><Inline text={b.text} /></p>
              : <Fold key={i} text={b.text} limit={420} className="text-[13px] text-slate-300 leading-relaxed" />;
          case "h":
            return <h4 key={i} className="text-xs font-semibold text-slate-200 pt-1">{plain(b.text)}</h4>;
          case "code":
            return <pre key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] font-mono text-slate-400 whitespace-pre">{b.text}</pre>;
          case "quote":
            return <QuoteBlock key={i} quote={b.text} />;
          case "table":
            return <Table key={i} header={b.header} rows={b.rows} />;
          case "list":
            if (scenarios && b.items.some(it => tsOf(it.text))) return <TsCards key={i} items={b.items} expandAll={scenarios.expandAll} />;
            return isFactList(b.items) ? <FactGrid key={i} items={b.items} /> : <ItemList key={i} items={b.items} ordered={b.ordered} depth={0} />;
        }
      })}
    </div>
  );
}

/* ------------------------------------------------------------- scenarios */

const TS_RE = /^\*\*([A-Za-z0-9]+_TS\d+[A-Za-z0-9]*)\*\*\s*[—–-]?\s*(.*)$/;
const tsOf = (text: string) => text.match(TS_RE);

function priorityOf(it: Item): string | null {
  for (const k of it.kids) {
    const f = factOf(k.text) ?? (k.text.match(/^\*\*(Priority)\*\*\s*(.*)$/i) ? { label: "Priority", value: k.text.replace(/^\*\*Priority\*\*\s*:?\s*/i, "") } : null);
    if (f && /^priority$/i.test(plain(f.label))) return plain(f.value).match(/\bP[123]\b/)?.[0] ?? null;
  }
  return null;
}

/** Counts P1 / P2 / P3 in a scenarios.md text. */
export function priorityCounts(source: string): Record<"P1" | "P2" | "P3", number> {
  const c = { P1: 0, P2: 0, P3: 0 };
  for (const m of source.matchAll(/\*\*Priority:?\*\*:?\s*\**\s*(P[123])\b/g)) c[m[1] as "P1"]++;
  return c;
}

const PRIORITY_TONE: Record<string, string> = {
  P1: "bg-red-500/10 border-red-500/40 text-red-300",
  P2: "bg-amber-500/10 border-amber-500/40 text-amber-300",
  P3: "bg-slate-800 border-slate-700 text-slate-300",
};

export function PriorityChip({ p, title }: { p: string; title?: string }) {
  return <span title={title} className={clsx("inline-block text-[10px] font-semibold px-1.5 leading-4 rounded-full border", PRIORITY_TONE[p] ?? PRIORITY_TONE.P3)}>{p}</span>;
}

function TsCard({ it, expandAll }: { it: Item; expandAll: boolean }) {
  const [open, setOpen] = useState(expandAll);
  const m = tsOf(it.text)!;
  const parts: Record<string, Item> = {};
  const extra: Item[] = [];
  for (const k of it.kids) {
    const f = factOf(k.text) ?? (k.text.match(/^\*\*([^*]{1,30})\*\*\s*$/) ? { label: k.text.replace(/\*\*/g, ""), value: "" } : null);
    const name = f ? plain(f.label).toLowerCase() : "";
    if (/^(objective|steps|expected|priority)/.test(name)) parts[name.replace(/\s.*$/, "")] = { ...k, text: f!.value };
    else extra.push(k);
  }
  const prio = priorityOf(it);
  const steps = parts.steps?.kids ?? [];
  const expected = parts.expected?.kids ?? [];
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
      <header className="flex flex-wrap items-start gap-2">
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 shrink-0">{m[1]}</span>
        <span className="flex-1 min-w-[10rem] text-[13px] font-semibold text-slate-100 leading-snug"><Inline text={m[2]} /></span>
        {prio && <PriorityChip p={prio} title="Test priority" />}
      </header>
      {parts.objective?.text && <p className="text-[13px] text-slate-300 leading-relaxed"><Inline text={parts.objective.text} /></p>}
      {(steps.length > 0 || expected.length > 0) && (
        open ? (
          <div className={clsx("grid gap-3", expandAll && "lg:grid-cols-2")}>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Steps</div>
              <ol className="space-y-0.5">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-300 leading-relaxed"><span className="text-slate-600 w-4 shrink-0 tabular-nums">{i + 1}.</span><span className="min-w-0"><Inline text={s.text} /></span></li>
                ))}
              </ol>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Expected result</div>
              <ul className="space-y-1">
                {expected.map((e, i) => {
                  const [page, ...rest] = e.text.split(/\s+->\s+/);
                  return (
                    <li key={i} className="rounded border border-slate-800 bg-slate-900/60 px-2 py-1 text-xs leading-relaxed">
                      {rest.length
                        ? <><span className="block text-[11px] text-slate-500"><Inline text={page} /></span><span className="text-slate-200"><Inline text={rest.join(" -> ")} /></span></>
                        : <span className="text-slate-200"><Inline text={e.text} /></span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null
      )}
      {open && extra.length > 0 && (
        <div className="text-[11px] text-slate-500 space-y-0.5">
          {extra.map((x, i) => <div key={i}><Inline text={x.text} /></div>)}
        </div>
      )}
      {(steps.length > 0 || expected.length > 0 || extra.length > 0) && (
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline">
          {open ? "Hide steps and expected result" : `Show ${steps.length} step${steps.length === 1 ? "" : "s"} and ${expected.length} expected result${expected.length === 1 ? "" : "s"}`}
        </button>
      )}
    </article>
  );
}

function TsCards({ items, expandAll }: { items: Item[]; expandAll: boolean }) {
  return (
    <div className={clsx("grid gap-2 items-start", !expandAll && items.length > 1 && "xl:grid-cols-2")}>
      {items.map((it, i) => tsOf(it.text)
        ? <TsCard key={i} it={it} expandAll={expandAll} />
        : <div key={i} className="text-[13px] text-slate-300"><ItemBody it={it} depth={0} /></div>)}
    </div>
  );
}

/* --------------------------------------------------------------- sections */

export interface EstimateLike {
  mandays?: number;
  range?: number[];
  confidence?: string;
}

const CONF_TONE: Record<string, string> = {
  high: "bg-green-500/10 border-green-500/40 text-green-300",
  medium: "bg-amber-500/10 border-amber-500/40 text-amber-300",
  low: "bg-red-500/10 border-red-500/40 text-red-300",
};
export function ConfidencePill({ value, bare }: { value?: string; bare?: boolean }) {
  if (!value) return null;
  const v = value.toLowerCase();
  return <span className={clsx("inline-block text-[11px] px-2 leading-5 rounded-full border", CONF_TONE[v] ?? CONF_TONE.medium)}>{bare ? v[0].toUpperCase() + v.slice(1) : `${v[0].toUpperCase()}${v.slice(1)} confidence`}</span>;
}

function sectionText(s: Section): string {
  const flat = (bs: Block[]): string => bs.map(b => b.t === "list" ? flatItems(b.items) : b.t === "table" ? [b.header, ...b.rows].map(r => r.join(" ")).join("\n") : "text" in b ? b.text : "").join("\n");
  const flatItems = (its: Item[]): string => its.map(it => it.text + "\n" + flatItems(it.kids)).join("\n");
  return [flat(s.blocks), ...s.subs.map(x => flat(x.blocks))].join("\n");
}

function StatTiles({ text, estimate }: { text: string; estimate?: EstimateLike | null }) {
  const t = plain(text);
  const md = estimate?.mandays ?? Number(t.match(/Estimate:?\s*([\d.]+)\s*man-?days?/i)?.[1] ?? t.match(/([\d.]+)\s*man-?days?/i)?.[1] ?? NaN);
  const range = estimate?.range?.length === 2 ? `${estimate.range[0]}–${estimate.range[1]}` : t.match(/range\s*([\d.]+\s*[–-]\s*[\d.]+)/i)?.[1]?.replace(/\s*[–-]\s*/, "–");
  const conf = estimate?.confidence ?? t.match(/Confidence:?\s*(high|medium|low)/i)?.[1];
  const ts = t.match(/TS count[^:\n]*:\s*([\d]+(?:\s*[–-]\s*\d+)?)/i)?.[1]?.replace(/\s*[–-]\s*/, "–");
  const tiles: { label: string; value: ReactNode }[] = [];
  if (Number.isFinite(md)) tiles.push({ label: "Man-days", value: <span className="text-2xl font-semibold text-slate-100">{md}</span> });
  if (range) tiles.push({ label: "Range", value: <span className="text-lg font-semibold text-slate-200">{range}</span> });
  if (ts) tiles.push({ label: "Expected TS", value: <span className="text-lg font-semibold text-slate-200">{ts}</span> });
  if (conf) tiles.push({ label: "Confidence", value: <ConfidencePill value={conf} bare /> });
  if (!tiles.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {tiles.map(x => (
        <div key={x.label} className="rounded-lg border border-blue-500/25 bg-blue-500/5 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">{x.label}</div>
          <div className="mt-0.5">{x.value}</div>
        </div>
      ))}
    </div>
  );
}

function summaryOf(s: Section, kind: string): string {
  if (kind === "scenarios") {
    const ts = sectionText(s).match(/\*\*[A-Za-z0-9]+_TS\d+[A-Za-z0-9]*\*\*/g)?.length ?? 0;
    if (ts) return `${ts} test scenario${ts === 1 ? "" : "s"}`;
  }
  const first = s.blocks.find(b => b.t !== "h" && !(b.t === "p" && /^(sources?|basis)\b[^:]{0,20}:/i.test(plain(b.text)))) ?? s.subs[0]?.blocks[0];
  if (!first) return s.subs.length ? s.subs.map(x => plain(x.title)).join(" · ") : "";
  if (first.t === "list") {
    if (isFactList(first.items)) {
      const facts = first.items.map(it => factOf(it.text)).filter((f): f is { label: string; value: string } => !!f);
      const key = facts.filter(f => /status|priority|deploy|env|portal|module|estimate|confidence/i.test(f.label));
      return (key.length ? key : facts).slice(0, 3).map(f => `${plain(f.label)}: ${plain(f.value).split(/[.;(]| — /)[0].trim()}`).join(" · ");
    }
    return plain(first.items[0]?.text ?? "");
  }
  if (first.t === "table") return `Table: ${first.header.map(plain).join(", ")}`;
  return "text" in first ? plain(first.text) : "";
}

function countOf(s: Section, kind: string): string {
  const list = s.blocks.find(b => b.t === "list") as Extract<Block, { t: "list" }> | undefined;
  const parts: string[] = [];
  if (kind === "scenarios") {
    const ts = sectionText(s).match(/\*\*[A-Za-z0-9]+_TS\d+[A-Za-z0-9]*\*\*/g)?.length ?? 0;
    if (ts) return `${ts} TS`;
  }
  if (s.subs.length) parts.push(`${s.subs.length} parts`);
  else if (list && list.items.length > 1) parts.push(`${list.items.length} points`);
  return parts.join(" · ");
}

const DEFAULT_OPEN = /^(header|what changes|estimated testing effort|questions|open questions for faizuddin|open points)/i;
const CALLOUT = /question|open points/i;

function SectionCard({ s, kind, open: startOpen, estimate, expandAll }: { s: Section; kind: string; open: boolean; estimate?: EstimateLike | null; expandAll: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const callout = CALLOUT.test(s.title);
  const effort = /estimated testing effort|^estimate/i.test(s.title);
  const summary = summaryOf(s, kind);
  const count = countOf(s, kind);
  const unconfirmed = (sectionText(s).match(/\[unconfirmed/gi) ?? []).length;
  return (
    <section className={clsx(
      "rounded-xl border",
      callout ? "border-amber-500/40 bg-amber-500/5" : "border-slate-800 bg-slate-900/60",
    )}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full text-left px-3 sm:px-4 py-2.5 flex items-start gap-2">
        {callout ? <HelpCircle size={15} className="text-amber-300 shrink-0 mt-0.5" aria-hidden />
          : kind === "scenarios" ? <ListChecks size={15} className="text-blue-400 shrink-0 mt-0.5" aria-hidden /> : null}
        <span className="flex-1 min-w-0">
          <span className={clsx("block text-sm font-semibold", callout ? "text-amber-200" : "text-slate-100")}>{plain(s.title)}</span>
          {!open && summary && <span className="block text-xs text-slate-400 truncate mt-0.5">{summary}</span>}
        </span>
        <span className="flex items-center gap-1.5 shrink-0 pt-0.5">
          {unconfirmed > 0 && <span className="hidden sm:inline text-[10px] px-1.5 leading-4 rounded-full border bg-amber-500/10 border-amber-500/40 text-amber-300">{unconfirmed} unconfirmed</span>}
          {count && <span className="text-[11px] text-slate-500">{count}</span>}
          <ChevronDown size={14} className={clsx("text-slate-500 transition-transform", !open && "-rotate-90")} aria-hidden />
        </span>
      </button>
      {open && (
        <div className="px-3 sm:px-4 pb-3 space-y-3">
          {effort && <StatTiles text={sectionText(s)} estimate={estimate} />}
          <Blocks blocks={s.blocks} scenarios={kind === "scenarios" ? { expandAll } : undefined} />
          {s.subs.map((x, i) => <SubCard key={i} sub={x} startOpen={s.subs.length <= 2} kind={kind} expandAll={expandAll} />)}
        </div>
      )}
    </section>
  );
}

function SubCard({ sub, startOpen, kind, expandAll }: { sub: Sub; startOpen: boolean; kind: string; expandAll: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const fake: Section = { title: sub.title, blocks: sub.blocks, subs: [] };
  const summary = summaryOf(fake, kind);
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full text-left px-3 py-2 flex items-start gap-2">
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold text-slate-200">{plain(sub.title)}</span>
          {!open && summary && <span className="block text-xs text-slate-500 truncate">{summary}</span>}
        </span>
        <ChevronDown size={13} className={clsx("text-slate-500 shrink-0 mt-1 transition-transform", !open && "-rotate-90")} aria-hidden />
      </button>
      {open && <div className="px-3 pb-3"><Blocks blocks={sub.blocks} scenarios={kind === "scenarios" ? { expandAll } : undefined} /></div>}
    </div>
  );
}

/* ------------------------------------------------------------------- main */

export default function SectionedDoc({ source, kind = "study", openSections, estimate, skipSections }: {
  source: string;
  /** "scenarios" turns TS items into cards; the others only change the summary text. */
  kind?: "study" | "related" | "scenarios" | "text";
  /** Sections that start open; default: Header, What changes, Estimated testing effort, questions. */
  openSections?: RegExp;
  /** Figures from brief.json for the effort tiles (they win over the text). */
  estimate?: EstimateLike | null;
  /** Sections not shown (e.g. "Ticket brief", already shown as its own card). */
  skipSections?: RegExp;
}) {
  const doc = parseDoc(source);
  const sections = skipSections ? doc.sections.filter(s => !skipSections.test(s.title)) : doc.sections;
  const tsTotal = kind === "scenarios" ? (source.match(/^\s*\d+\.\s+\*\*[A-Za-z0-9]+_TS\d+/gm)?.length ?? 0) : 0;
  const openRe = openSections ?? (kind === "scenarios" ? /./ : DEFAULT_OPEN);
  if (!doc.sections.length) {
    return <Blocks blocks={doc.preamble} scenarios={kind === "scenarios" ? { expandAll: tsTotal <= 4 } : undefined} />;
  }
  return (
    <div className="space-y-2.5">
      {doc.preamble.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs">
          <Blocks blocks={doc.preamble} />
        </div>
      )}
      {sections.map((s, i) => (
        <SectionCard key={`${i}-${s.title}`} s={s} kind={kind} open={openRe.test(s.title)} estimate={estimate} expandAll={tsTotal <= 4} />
      ))}
    </div>
  );
}
