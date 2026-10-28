"use client";
import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, Flame, Trophy, Zap, Clock } from "lucide-react";
import clsx from "clsx";
import { levelFromXp, formatDuration, type TodoStats } from "@/lib/todo";

const LEVEL_TITLES = ["Rookie", "Tester", "Bug Hunter", "Edge-Case Finder", "Regression Ranger", "QA Knight", "Release Guardian", "Zero-Defect Legend"];

export function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, level - 1)];
}

export function ProgressRing({ value, total, size = 84 }: { value: number; total: number; size?: number }) {
  const stroke = size > 60 ? 8 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const complete = total > 0 && value >= total;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${value} of ${total} done today`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: "var(--bg-hover, #334155)" }} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          className={clsx("transition-[stroke-dashoffset] duration-700 ease-out", complete ? "stroke-green-500" : "stroke-blue-500")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={clsx("font-semibold text-slate-100 tabular-nums", size > 60 ? "text-xl" : "text-sm")}>{value}<span className="text-slate-500 font-normal">/{total}</span></span>
        {size > 60 && <span className="text-[10px] text-slate-500 mt-1">today</span>}
      </div>
    </div>
  );
}

export function XpBar({ xp, compact }: { xp: number; compact?: boolean }) {
  const { level, into, span } = levelFromXp(xp);
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-slate-200 font-medium truncate">
          <Trophy size={13} className="text-amber-400 shrink-0" />
          Lv {level}{!compact && <span className="text-slate-500 font-normal truncate">· {levelTitle(level)}</span>}
        </span>
        <span className="text-slate-500 tabular-nums shrink-0">{into}/{span} XP</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-700 ease-out" style={{ width: `${(into / span) * 100}%` }} />
      </div>
    </div>
  );
}

export default function SummaryHeader({ stats }: { stats: TodoStats }) {
  const allClear = stats.todayTotal > 0 && stats.doneToday >= stats.todayTotal;
  const tiles = [
    { label: "Due today", value: stats.dueToday,     icon: CalendarDays,  tone: "text-amber-400",  bg: "bg-amber-500/10" },
    { label: "Overdue",   value: stats.overdue,      icon: AlertTriangle, tone: "text-red-400",    bg: "bg-red-500/10" },
    { label: "Upcoming",  value: stats.upcoming,     icon: CalendarClock, tone: "text-sky-400",    bg: "bg-sky-500/10" },
    { label: "Done this week", value: stats.doneThisWeek, icon: CheckCircle2, tone: "text-green-400", bg: "bg-green-500/10" },
  ];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-4 md:pr-5 md:border-r md:border-slate-800">
          <ProgressRing value={stats.doneToday} total={stats.todayTotal} />
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-100">
              {allClear ? "Day cleared" : stats.todayTotal === 0 ? "A clear day" : `${stats.todayTotal - stats.doneToday} left today`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {allClear ? "Everything due today is done." : stats.todayTotal === 0 ? "Nothing due. Pick something from later." : "Overdue counts toward today."}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className={clsx("flex items-center gap-1", stats.streak > 0 ? "text-orange-400" : "text-slate-500")} title="Consecutive days with at least one task done">
                <Flame size={13} /> {stats.streak}-day streak
              </span>
              <span className="flex items-center gap-1 text-slate-400" title="XP earned this week">
                <Zap size={13} className="text-amber-400" /> {stats.xpThisWeek} XP
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {tiles.map(t => (
              <div key={t.label} className="rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={clsx("w-6 h-6 rounded-lg flex items-center justify-center", t.bg)}><t.icon size={13} className={t.tone} /></span>
                  <span className="text-lg font-semibold text-slate-100 tabular-nums">{t.value}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{t.label}</p>
              </div>
            ))}
          </div>
          <XpBar xp={stats.xp} />
        </div>
      </div>
    </section>
  );
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyReview({ stats }: { stats: TodoStats }) {
  const max = Math.max(1, ...stats.perDayThisWeek);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const best = stats.perDayThisWeek.reduce((bi, v, i, a) => (v > a[bi] ? i : bi), 0);
  const hasAny = stats.doneThisWeek > 0;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">This week</h2>
        <span className="text-[11px] text-slate-500">Mon to Sun</span>
      </div>
      <div className="mt-4 flex items-end gap-2 h-24" role="img" aria-label={`Tasks done per day this week: ${stats.perDayThisWeek.map((v, i) => `${DAY_NAMES[i]} ${v}`).join(", ")}`}>
        {stats.perDayThisWeek.map((v, i) => (
          <div key={i} className="group/bar flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${DAY_NAMES[i]}: ${v} done`}>
            <span className="text-[10px] text-slate-400 tabular-nums opacity-0 group-hover/bar:opacity-100 transition-opacity">{v}</span>
            <div
              className={clsx("w-full max-w-7 rounded-t-md transition-[height] duration-700",
                i > todayIdx ? "bg-slate-800" : hasAny && i === best && v > 0 ? "bg-green-500" : "bg-blue-500/70")}
              style={{ height: `${Math.max(4, (v / max) * 72)}px` }}
            />
            <span className={clsx("text-[10px]", i === todayIdx ? "text-slate-200 font-semibold" : "text-slate-500")}>{DAY_NAMES[i].slice(0, 2)}</span>
          </div>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-950/40 border border-slate-800 py-2">
          <dt className="text-[10px] text-slate-500">Done</dt>
          <dd className="text-sm font-semibold text-slate-100 tabular-nums">{stats.doneThisWeek}</dd>
        </div>
        <div className="rounded-xl bg-slate-950/40 border border-slate-800 py-2">
          <dt className="text-[10px] text-slate-500">Best day</dt>
          <dd className="text-sm font-semibold text-slate-100">{hasAny ? DAY_NAMES[best] : "–"}</dd>
        </div>
        <div className="rounded-xl bg-slate-950/40 border border-slate-800 py-2">
          <dt className="text-[10px] text-slate-500 flex items-center justify-center gap-1"><Clock size={9} />Focused</dt>
          <dd className="text-sm font-semibold text-slate-100">{stats.focusSecThisWeek > 0 ? formatDuration(stats.focusSecThisWeek) : "–"}</dd>
        </div>
      </dl>
    </section>
  );
}
