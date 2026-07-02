import React from "react";

const URL_RE = /https?:\/\/[^\s<>]+[^\s<>.,;:!?)\]'"]/g;

/**
 * Renders text with URLs turned into clickable blue links.
 * Wraps in a <p> by default; pass `inline` for a <span>.
 */
export default function Linkified({
  text,
  className,
  inline = false,
}: {
  text: string;
  className?: string;
  inline?: boolean;
}) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  URL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-blue-400 underline underline-offset-2 break-all hover:text-blue-300"
        onClick={e => e.stopPropagation()}
      >
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (inline) {
    return <span className={className}>{parts}</span>;
  }
  return <p className={className}>{parts}</p>;
}
