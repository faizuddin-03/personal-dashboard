"use client";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { tokenExpiryStatus } from "@/lib/jira";

interface Props {
  expiry?: string;
  onSettingsClick: () => void;
}

export default function TokenExpiryBanner({ expiry, onSettingsClick }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const status = tokenExpiryStatus(expiry);

  if (!status || status.level === "ok" || dismissed) return null;

  const styles = {
    warn: "bg-yellow-950/60 border-yellow-700/50 text-yellow-300",
    critical: "bg-red-950/60 border-red-700/50 text-red-300",
    expired: "bg-red-950/80 border-red-600 text-red-200",
  }[status.level];

  const message =
    status.level === "expired"
      ? "Your Jira API token has expired. Update it in Settings."
      : `Your Jira API token expires in ${status.daysLeft} day${status.daysLeft !== 1 ? "s" : ""} (${new Date(expiry!).toLocaleDateString()}).`;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border rounded-xl text-sm ${styles}`}>
      <AlertTriangle size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onSettingsClick}
        className="underline underline-offset-2 hover:no-underline shrink-0 text-xs font-medium"
      >
        Update token
      </button>
      <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
