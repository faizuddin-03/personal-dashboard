"use client";
import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getQaPortalTokenExpiry, qaPortalDaysLeft } from "@/lib/qaPortalToken";

// Shows from 1 day before the QA Portal token expires (Faizuddin, 2026-10-29).
export default function QaPortalTokenBanner() {
  const [expiry, setExpiry] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { setExpiry(getQaPortalTokenExpiry()); }, []);

  const daysLeft = qaPortalDaysLeft(expiry);
  if (daysLeft === null || daysLeft > 1 || dismissed) return null;

  const date = new Date(`${expiry}T00:00:00`).toLocaleDateString();
  const message =
    daysLeft < 0 ? `Your QA Portal API token expired on ${date}. Create a new one and update Claude Code.`
    : daysLeft === 0 ? `Your QA Portal API token expires today (${date}).`
    : `Your QA Portal API token expires tomorrow (${date}).`;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border rounded-xl text-sm ${daysLeft < 0 ? "bg-red-950/80 border-red-600 text-red-200" : "bg-red-950/60 border-red-700/50 text-red-300"}`}>
      <AlertTriangle size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <a
        href="http://10.30.10.214"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:no-underline shrink-0 text-xs font-medium"
      >
        Open QA Portal
      </a>
      <Link href="/settings" className="underline underline-offset-2 hover:no-underline shrink-0 text-xs font-medium">
        Update date
      </Link>
      <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
