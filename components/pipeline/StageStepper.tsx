"use client";
// Stage stepper for the pipeline workspace (Faizuddin, 2026-10-27).
import { Check } from "lucide-react";
import clsx from "clsx";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/pipeline/types";

export default function StageStepper({ stage }: { stage: PipelineStage }) {
  const current = PIPELINE_STAGES.findIndex(s => s.id === stage);
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Pipeline stage">
      {PIPELINE_STAGES.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s.id} className="flex items-center gap-1.5">
            <span
              aria-current={now ? "step" : undefined}
              className={clsx(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border",
                now && "bg-blue-600/20 text-blue-300 border-blue-500/40 font-medium",
                done && "bg-green-500/10 text-green-300 border-green-500/30",
                !now && !done && "bg-slate-800/60 text-slate-500 border-slate-700",
              )}
            >
              {done && <Check size={10} aria-hidden />}
              {s.label}
            </span>
            {i < PIPELINE_STAGES.length - 1 && <span className="text-slate-700 text-[10px]" aria-hidden>›</span>}
          </li>
        );
      })}
    </ol>
  );
}
