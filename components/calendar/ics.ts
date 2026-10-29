// ICS (iCalendar) export of the items in the visible range.

import { CalItem } from "./model";
import { addDays, epochOf } from "./dates";

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function dateVal(d: string): string { return d.replace(/-/g, ""); }
function utcStamp(ms: number): string { return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }

/** Fold lines longer than 75 octets (RFC 5545 §3.1). */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const out: string[] = [];
  for (let i = 0; i < line.length; i += 73) out.push((i ? " " : "") + line.slice(i, i + 73));
  return out.join("\r\n");
}

export function buildIcs(items: CalItem[]): string {
  const stamp = utcStamp(Date.now());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//QA Dashboard//Calendar//EN", "CALSCALE:GREGORIAN"];
  for (const it of items) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${it.key.replace(/[^A-Za-z0-9:.-]/g, "")}@qa-dashboard`);
    lines.push(`DTSTAMP:${stamp}`);
    if (it.allDay || it.start === undefined) {
      lines.push(`DTSTART;VALUE=DATE:${dateVal(it.date)}`);
      lines.push(`DTEND;VALUE=DATE:${dateVal(addDays(it.endDate, 1))}`);
    } else {
      lines.push(`DTSTART:${utcStamp(epochOf(it.date, it.start))}`);
      lines.push(`DTEND:${utcStamp(epochOf(it.date, it.end ?? it.start + 60))}`);
    }
    const prefix = it.source === "deployment" ? "[Deploy] " : it.source === "holiday" ? "[Holiday] " : "";
    lines.push(`SUMMARY:${esc(prefix + it.title)}`);
    const desc = [
      it.label,
      it.dep?.fixVersion ? `Release: ${it.dep.fixVersion}` : "",
      it.jira ? `Release: ${it.jira.version}` : "",
      it.dep?.environment ? `Environment: ${it.dep.environment}` : "",
      it.jiraKeys.length ? `Tickets: ${it.jiraKeys.join(", ")}` : "",
      it.notes ?? "",
    ].filter(Boolean).join("\n");
    if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
    lines.push(`CATEGORIES:${esc(it.label)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadIcs(items: CalItem[], from: string, to: string) {
  const blob = new Blob([buildIcs(items)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `calendar-${from}-to-${to}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
