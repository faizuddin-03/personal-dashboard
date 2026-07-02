"use client";
import clsx from "clsx";

type AdfNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: AdfNode[];
  marks?: AdfMark[];
};

type AdfMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

interface Props {
  node: AdfNode | null;
  className?: string;
}

export default function AdfRenderer({ node, className }: Props) {
  if (!node) return null;
  return (
    <div className={clsx("adf-root text-sm text-slate-300 leading-relaxed", className)}>
      {renderChildren(node)}
    </div>
  );
}

function renderChildren(node: AdfNode): React.ReactNode {
  if (!node.content) return null;
  return node.content.map((child, i) => <AdfNode key={i} node={child} />);
}

function AdfNode({ node }: { node: AdfNode }): React.ReactNode {
  switch (node.type) {
    case "text":
      return applyMarks(node.text ?? "", node.marks);

    case "paragraph":
      return <p className="mb-2 last:mb-0">{renderChildren(node)}</p>;

    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const cls = level === 1 ? "text-base font-bold text-slate-100 mb-2 mt-3 first:mt-0"
                : level === 2 ? "text-sm font-bold text-slate-200 mb-1.5 mt-3 first:mt-0"
                : "text-sm font-semibold text-slate-300 mb-1 mt-2 first:mt-0";
      const Tag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      return <Tag className={cls}>{renderChildren(node)}</Tag>;
    }

    case "bulletList":
      return <ul className="list-disc list-outside pl-5 mb-2 space-y-0.5">{renderChildren(node)}</ul>;

    case "orderedList":
      return <ol className="list-decimal list-outside pl-5 mb-2 space-y-0.5">{renderChildren(node)}</ol>;

    case "listItem":
      return <li>{renderChildren(node)}</li>;

    case "blockquote":
      return (
        <blockquote className="border-l-2 border-slate-600 pl-3 my-2 text-slate-400 italic">
          {renderChildren(node)}
        </blockquote>
      );

    case "codeBlock": {
      const lang = (node.attrs?.language as string) ?? "";
      return (
        <pre className="bg-slate-950 border border-slate-700 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-slate-300">
          {lang && <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">{lang}</div>}
          <code>{renderChildren(node) ?? node.text}</code>
        </pre>
      );
    }

    case "rule":
      return <hr className="border-slate-700 my-3" />;

    case "hardBreak":
      return <br />;

    case "table":
      return (
        <div className="overflow-x-auto my-2 rounded-lg border border-slate-700">
          <table className="w-full text-xs border-collapse">
            <tbody>{renderChildren(node)}</tbody>
          </table>
        </div>
      );

    case "tableRow":
      return <tr className="border-b border-slate-700 last:border-0">{renderChildren(node)}</tr>;

    case "tableHeader":
      return (
        <th className="bg-slate-800 text-left px-3 py-2 text-xs font-semibold text-slate-200 border-r border-slate-700 last:border-r-0">
          {renderChildren(node)}
        </th>
      );

    case "tableCell":
      return (
        <td className="px-3 py-2 text-xs text-slate-300 border-r border-slate-700 last:border-r-0 align-top">
          {renderChildren(node)}
        </td>
      );

    case "panel": {
      const panelType = (node.attrs?.panelType as string) ?? "info";
      const panelStyles: Record<string, string> = {
        info:    "bg-blue-950/40 border-blue-800/50 text-blue-200",
        note:    "bg-purple-950/40 border-purple-800/50 text-purple-200",
        warning: "bg-amber-950/40 border-amber-800/50 text-amber-200",
        error:   "bg-red-950/40 border-red-800/50 text-red-200",
        success: "bg-green-950/40 border-green-800/50 text-green-200",
      };
      const panelEmoji: Record<string, string> = {
        info: "ℹ️", note: "📝", warning: "⚠️", error: "❌", success: "✅",
      };
      return (
        <div className={clsx("border rounded-lg p-3 my-2 text-xs", panelStyles[panelType] ?? panelStyles.info)}>
          <span className="mr-1.5">{panelEmoji[panelType] ?? "ℹ️"}</span>
          {renderChildren(node)}
        </div>
      );
    }

    case "status": {
      const text = (node.attrs?.text as string) ?? "";
      const color = (node.attrs?.color as string) ?? "neutral";
      const statusStyles: Record<string, string> = {
        neutral:  "bg-slate-700 text-slate-300",
        purple:   "bg-purple-900/60 text-purple-300",
        blue:     "bg-blue-900/60 text-blue-300",
        green:    "bg-green-900/60 text-green-300",
        yellow:   "bg-amber-900/60 text-amber-300",
        red:      "bg-red-900/60 text-red-300",
      };
      return (
        <span className={clsx("inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded", statusStyles[color] ?? statusStyles.neutral)}>
          {text}
        </span>
      );
    }

    case "mention": {
      const mentionText = (node.attrs?.text as string) ?? "";
      return (
        <span className="inline-block text-blue-400 bg-blue-950/40 px-1 rounded text-xs font-medium">
          {mentionText}
        </span>
      );
    }

    case "emoji": {
      const shortName = (node.attrs?.shortName as string) ?? "";
      const text = (node.attrs?.text as string) ?? shortName;
      return <span>{text}</span>;
    }

    case "inlineCard": {
      const url = (node.attrs?.url as string) ?? "";
      return (
        <a href={url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs break-all">
          {url}
        </a>
      );
    }

    case "mediaSingle":
    case "mediaGroup":
      return <div className="my-2">{renderChildren(node)}</div>;

    case "media": {
      const alt = (node.attrs?.alt as string) ?? "Attachment";
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400">
          <span>📎</span>
          <span>{alt}</span>
          <span className="text-slate-600">(view in Jira)</span>
        </div>
      );
    }

    case "expand":
    case "nestedExpand": {
      const title = (node.attrs?.title as string) ?? "Details";
      return (
        <details className="my-2 bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden">
          <summary className="px-3 py-2 text-xs font-medium text-slate-300 cursor-pointer hover:bg-slate-800 select-none">
            {title}
          </summary>
          <div className="px-3 py-2 border-t border-slate-700">
            {renderChildren(node)}
          </div>
        </details>
      );
    }

    case "taskList":
      return <div className="my-1 space-y-0.5">{renderChildren(node)}</div>;

    case "taskItem": {
      const checked = (node.attrs?.state as string) === "DONE";
      return (
        <div className="flex items-start gap-2">
          <span className={clsx("mt-0.5 shrink-0", checked ? "text-green-400" : "text-slate-600")}>
            {checked ? "☑" : "☐"}
          </span>
          <span className={checked ? "line-through text-slate-500" : ""}>{renderChildren(node)}</span>
        </div>
      );
    }

    case "decisionList":
      return <div className="my-1 space-y-0.5">{renderChildren(node)}</div>;

    case "decisionItem":
      return (
        <div className="flex items-start gap-2">
          <span className="text-amber-400 mt-0.5 shrink-0">◆</span>
          <span>{renderChildren(node)}</span>
        </div>
      );

    case "date": {
      const ts = node.attrs?.timestamp as number | string | undefined;
      if (!ts) return null;
      const d = new Date(typeof ts === "string" ? parseInt(ts, 10) : ts);
      return (
        <span className="inline-block bg-blue-950/40 text-blue-300 text-xs px-1.5 py-0.5 rounded font-medium">
          {d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      );
    }

    case "placeholder":
      return <span className="text-slate-600 italic">{(node.attrs?.text as string) ?? ""}</span>;

    default:
      if (node.content) return <>{renderChildren(node)}</>;
      return null;
  }
}

function applyMarks(text: string, marks?: AdfMark[]): React.ReactNode {
  if (!marks || marks.length === 0) return text;

  let result: React.ReactNode = text;

  for (const mark of marks) {
    switch (mark.type) {
      case "strong":
        result = <strong className="font-bold text-slate-200">{result}</strong>;
        break;
      case "em":
        result = <em>{result}</em>;
        break;
      case "underline":
        result = <u className="underline underline-offset-2">{result}</u>;
        break;
      case "strike":
        result = <s className="text-slate-500">{result}</s>;
        break;
      case "code":
        result = <code className="bg-slate-800 text-pink-300 px-1 py-0.5 rounded text-xs font-mono">{result}</code>;
        break;
      case "link": {
        const href = (mark.attrs?.href as string) ?? "#";
        result = (
          <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
            {result}
          </a>
        );
        break;
      }
      case "textColor": {
        const color = (mark.attrs?.color as string) ?? "";
        result = <span style={{ color }}>{result}</span>;
        break;
      }
      case "subsup": {
        const type = mark.attrs?.type as string;
        if (type === "sub") result = <sub>{result}</sub>;
        else result = <sup>{result}</sup>;
        break;
      }
    }
  }

  return result;
}
