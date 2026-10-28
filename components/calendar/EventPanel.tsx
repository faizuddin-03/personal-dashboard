"use client";
// Create / edit a custom event in a right-hand slide-over.

import { useState } from "react";
import clsx from "clsx";
import { Bell, CalendarDays, Repeat } from "lucide-react";
import {
  CalendarEvent, EventCategory, EventRecurrence,
  EVENT_CATEGORIES, EVENT_CATEGORY_META, EVENT_COLOR_META, leaveLabel,
} from "@/lib/calendar-events";
import { fmtLong, toHHMM, toMin } from "./dates";
import { ConfirmDelete, JiraChip, Segmented, SidePanel, btnOutline, btnPrimary, inp, lbl, sel } from "./ui";
import { useColorScheme } from "./store";
import type { Draft } from "./TimeGrid";

const REMINDERS: { value: string; label: string }[] = [
  { value: "", label: "No reminder" },
  { value: "0", label: "At start time" },
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

export interface EventPanelProps {
  initial?: CalendarEvent;
  /** Occurrence date the user clicked, for recurring events. */
  occurrence?: string;
  draft?: Draft;
  remindersOn: boolean;
  onClose: () => void;
  onSave: (e: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onSkip: (id: string, date: string) => void;
}

export default function EventPanel({ initial, occurrence, draft, remindersOn, onClose, onSave, onDelete, onSkip }: EventPanelProps) {
  const scheme = useColorScheme();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<EventCategory>(initial?.category ?? "other");
  const [allDay, setAllDay] = useState(initial?.allDay ?? draft?.allDay ?? true);
  const [startDate, setStartDate] = useState(initial?.startDate ?? draft?.date ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? draft?.endDate ?? draft?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? (draft?.start !== undefined ? toHHMM(draft.start) : "09:00"));
  const [endTime, setEndTime] = useState(initial?.endTime ?? (draft?.end !== undefined ? toHHMM(draft.end) : "10:00"));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [jiraKey, setJiraKey] = useState(initial?.jiraKey ?? "");
  const [recurrence, setRecurrence] = useState<EventRecurrence>(initial?.recurrence ?? "none");
  const [until, setUntil] = useState(initial?.recurrenceUntil ?? "");
  const [reminder, setReminder] = useState(initial?.reminderMin !== undefined ? String(initial.reminderMin) : "");
  // Leave (Faizuddin, 2026-10-26): full / half day, AM / PM; no repeat, reminder or Jira ticket.
  const [leaveDuration, setLeaveDuration] = useState<"full" | "half">(initial?.leaveDuration ?? "full");
  const [leaveHalf, setLeaveHalf] = useState<"am" | "pm">(initial?.leaveHalf ?? "am");
  const isLeave = category === "leave";
  const halfDay = isLeave && leaveDuration === "half";

  const hex = EVENT_COLOR_META[EVENT_CATEGORY_META[category].color].hex;
  const key = jiraKey.trim().toUpperCase();
  const keyValid = /^[A-Z][A-Z0-9]+-\d+$/.test(key);
  const timeErr = !allDay && startDate === endDate && (toMin(endTime) ?? 0) <= (toMin(startTime) ?? 0);
  const leaveTitle = leaveLabel({ leaveDuration, leaveHalf });
  const canSave = (title.trim() || isLeave) && startDate && (isLeave || !timeErr);
  const recurring = (initial?.recurrence ?? "none") !== "none";

  function save() {
    if (!canSave) return;
    const end = halfDay || endDate < startDate ? startDate : endDate;
    const timed = !isLeave && !allDay;
    onSave({
      ...(initial ?? {}),
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim() || (isLeave ? leaveTitle : ""),
      startDate, endDate: end,
      allDay: !timed,
      startTime: timed ? startTime : undefined,
      endTime: timed ? endTime : undefined,
      category,
      color: EVENT_CATEGORY_META[category].color,
      notes,
      jiraKey: isLeave ? undefined : key || undefined,
      recurrence: isLeave ? "none" : recurrence,
      recurrenceUntil: !isLeave && recurrence !== "none" && until ? until : undefined,
      reminderMin: isLeave || reminder === "" ? undefined : Number(reminder),
      leaveDuration: isLeave ? leaveDuration : undefined,
      leaveHalf: halfDay ? leaveHalf : undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const pick = { colorScheme: scheme } as const;

  return (
    <SidePanel
      title={initial ? "Edit event" : "New event"}
      icon={<CalendarDays size={16} style={{ color: hex }} />}
      accent={hex}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2 flex-wrap">
          {initial && <ConfirmDelete onConfirm={() => onDelete(initial.id)} label={recurring ? "Delete series" : "Delete"} question={recurring ? "Delete every repeat?" : "Delete event?"} />}
          {initial && recurring && occurrence && (
            <button onClick={() => onSkip(initial.id, occurrence)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200">Skip this date</button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className={btnOutline}>Cancel</button>
          <button onClick={save} disabled={!canSave} className={clsx(btnPrimary, "px-4")}>{initial ? "Save" : "Add event"}</button>
        </div>
      }
    >
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); }}
        placeholder={isLeave ? `${leaveTitle} (title optional)` : "Add title"}
        className="w-full bg-transparent text-xl font-semibold text-slate-100 placeholder-slate-600 border-0 border-b border-slate-800 focus:border-[color:var(--accent,#3b82f6)] focus:outline-none pb-2"
      />

      <div>
        <p className={lbl}>Category</p>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_CATEGORIES.map(c => {
            const h = EVENT_COLOR_META[EVENT_CATEGORY_META[c].color].hex;
            const on = c === category;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border motion-safe:transition-colors", on ? "text-slate-100" : "border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700")}
                style={on ? { background: `color-mix(in srgb, ${h} 20%, transparent)`, borderColor: h } : undefined}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: h }} />
                {EVENT_CATEGORY_META[c].label}
              </button>
            );
          })}
        </div>
      </div>

      {isLeave && (
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={leaveDuration}
            options={[{ value: "full", label: "Full day" }, { value: "half", label: "Half day" }]}
            onChange={v => { setLeaveDuration(v); if (v === "half") setEndDate(startDate); }}
          />
          {halfDay && (
            <Segmented
              value={leaveHalf}
              options={[{ value: "am", label: "AM" }, { value: "pm", label: "PM" }]}
              onChange={setLeaveHalf}
            />
          )}
        </div>
      )}

      <div className="space-y-3">
        {!isLeave && <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="w-4 h-4 accent-[color:var(--accent,#3b82f6)]" />
          <span className="text-sm text-slate-300">All day</span>
        </label>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Starts</label>
            <input type="date" value={startDate} onChange={e => { const v = e.target.value; setStartDate(v); if (isLeave || endDate < v) setEndDate(v); }} className={inp} style={pick} />
          </div>
          <div>
            <label className={lbl}>Ends</label>
            <input type="date" value={halfDay ? startDate : endDate} min={startDate} disabled={halfDay} title={halfDay ? "Half-day leave is one day" : undefined} onChange={e => setEndDate(e.target.value)} className={clsx(inp, halfDay && "opacity-50")} style={pick} />
          </div>
          {!allDay && !isLeave && (
            <>
              <input type="time" value={startTime} step={300} onChange={e => setStartTime(e.target.value)} className={inp} style={pick} aria-label="Start time" />
              <input type="time" value={endTime} step={300} onChange={e => setEndTime(e.target.value)} className={inp} style={pick} aria-label="End time" />
            </>
          )}
        </div>
        {timeErr && !isLeave && <p className="text-xs text-red-400">End time must be after the start time.</p>}
        {startDate && <p className="text-xs text-slate-500">{fmtLong(startDate)}{!halfDay && endDate && endDate !== startDate ? ` → ${fmtLong(endDate)}` : ""}{halfDay ? ` · ${leaveHalf.toUpperCase()}` : ""}</p>}
      </div>

      {!isLeave && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={clsx(lbl, "flex items-center gap-1")}><Repeat size={11} /> Repeat</label>
          <select value={recurrence} onChange={e => setRecurrence(e.target.value as EventRecurrence)} className={sel}>
            <option value="none">Does not repeat</option>
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
          </select>
        </div>
        {recurrence !== "none" && (
          <div>
            <label className={lbl}>Until (optional)</label>
            <input type="date" value={until} min={startDate} onChange={e => setUntil(e.target.value)} className={inp} style={pick} />
          </div>
        )}
        <div className={recurrence !== "none" ? "sm:col-span-2" : ""}>
          <label className={clsx(lbl, "flex items-center gap-1")}><Bell size={11} /> Reminder</label>
          <select value={reminder} onChange={e => setReminder(e.target.value)} className={sel}>
            {REMINDERS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {reminder !== "" && !remindersOn && (
            <p className="text-[11px] text-amber-400 mt-1">Turn on “Browser reminders” in the sidebar to get notified.</p>
          )}
          {reminder !== "" && allDay && <p className="text-[11px] text-slate-500 mt-1">All-day reminders count from 9:00 am.</p>}
        </div>
      </div>}

      {!isLeave && <div>
        <label className={lbl}>Jira ticket (optional)</label>
        <div className="flex items-center gap-2">
          <input value={jiraKey} onChange={e => setJiraKey(e.target.value)} placeholder="e.g. EAINT-12107" className={clsx(inp, "font-mono uppercase")} />
          {keyValid && <JiraChip k={key} />}
        </div>
      </div>}

      <div>
        <label className={lbl}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Agenda, links, test scope…" className={clsx(inp, "resize-y")} />
      </div>
    </SidePanel>
  );
}
