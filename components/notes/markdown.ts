// HTML (Tiptap output) → Markdown, for "Export as Markdown". Browser only.
import type { Note } from "@/lib/notes-store";

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/\s+/g, " ");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const inner = Array.from(el.childNodes).map(inline).join("");
  switch (el.tagName) {
    case "STRONG": case "B": return inner.trim() ? `**${inner}**` : inner;
    case "EM": case "I": return inner.trim() ? `*${inner}*` : inner;
    case "S": case "DEL": return inner.trim() ? `~~${inner}~~` : inner;
    case "CODE": return `\`${inner}\``;
    case "A": return `[${inner}](${el.getAttribute("href") ?? ""})`;
    case "IMG": return `![${el.getAttribute("alt") ?? ""}](${el.getAttribute("src") ?? ""})`;
    case "BR": return "  \n";
    default: return inner;
  }
}

function block(el: Element, depth = 0): string {
  const pad = "  ".repeat(depth);
  switch (el.tagName) {
    case "H1": return `# ${inline(el).trim()}\n\n`;
    case "H2": return `## ${inline(el).trim()}\n\n`;
    case "H3": return `### ${inline(el).trim()}\n\n`;
    case "H4": return `#### ${inline(el).trim()}\n\n`;
    case "P": { const t = inline(el).trim(); return t ? `${t}\n\n` : ""; }
    case "BLOCKQUOTE": return Array.from(el.children).map(c => block(c)).join("").trim().split("\n").map(l => `> ${l}`).join("\n") + "\n\n";
    case "PRE": return "```\n" + (el.textContent ?? "") + "\n```\n\n";
    case "HR": return "---\n\n";
    case "UL": case "OL": {
      const ordered = el.tagName === "OL";
      const isTasks = el.getAttribute("data-type") === "taskList";
      const items = Array.from(el.children).filter(c => c.tagName === "LI");
      const out = items.map((li, i) => {
        const marker = isTasks
          ? `- [${li.getAttribute("data-checked") === "true" ? "x" : " "}]`
          : ordered ? `${i + 1}.` : "-";
        const textParts: string[] = [];
        const nested: string[] = [];
        li.querySelectorAll(":scope > *, :scope > div > *").forEach(c => {
          if (c.tagName === "UL" || c.tagName === "OL") nested.push(block(c, depth + 1));
          else if (c.tagName !== "LABEL" && c.tagName !== "DIV") textParts.push(inline(c).trim());
        });
        if (textParts.length === 0 && nested.length === 0) textParts.push(inline(li).trim());
        return `${pad}${marker} ${textParts.filter(Boolean).join(" ")}\n${nested.join("")}`;
      }).join("");
      return depth === 0 ? out + "\n" : out;
    }
    case "TABLE": {
      const rows = Array.from(el.querySelectorAll("tr")).map(tr =>
        Array.from(tr.children).map(c => inline(c).trim().replace(/\|/g, "\\|")),
      );
      if (rows.length === 0) return "";
      const head = rows[0];
      const lines = [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.slice(1).map(r => `| ${r.join(" | ")} |`)];
      return lines.join("\n") + "\n\n";
    }
    default: {
      if (el.children.length) return Array.from(el.children).map(c => block(c, depth)).join("");
      const t = inline(el).trim();
      return t ? `${t}\n\n` : "";
    }
  }
}

export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  return Array.from(doc.body.children).map(c => block(c)).join("").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function noteToMarkdown(note: Note): string {
  const parts = [`# ${note.title || "Untitled"}`, ""];
  if (note.tags.length) parts.push(`Tags: ${note.tags.join(", ")}`, "");
  parts.push(htmlToMarkdown(note.content));
  return parts.join("\n");
}

export function downloadNoteMarkdown(note: Note) {
  const md = noteToMarkdown(note);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = (note.title || "note").replace(/[\\/:*?"<>|]+/g, "").trim().slice(0, 80) || "note";
  a.href = url;
  a.download = `${safe}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
