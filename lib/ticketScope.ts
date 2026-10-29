"use client";
// Global "All tickets / My tickets" filter.
// (Faizuddin, 2026-10-26: "the filter should be global. means if i filter in
// the calendar to my tickets only, any future modules that we make in the
// future that connects with the calendar dashboard must also show my tickets
// only".)
//
// RULE for every module that shows Jira tickets on (or alongside) the
// calendar: read the scope with useTicketScope() and drop tickets where
// isMyTicket() is false while the scope is "mine". Never keep a local copy of
// this setting. "Mine" = the Jira "QA" field (QA PIC, customfield_10041 on
// mfservices) holds the signed-in Jira user's accountId.
import { useSyncExternalStore } from "react";

export type TicketScope = "all" | "mine";

const KEY = "ticket_scope";
const EVENT = "ticket-scope-change";

function read(): TicketScope {
  try { return localStorage.getItem(KEY) === "mine" ? "mine" : "all"; } catch { return "all"; }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

export function useTicketScope(): TicketScope {
  return useSyncExternalStore(subscribe, read, () => "all");
}

export function setTicketScope(s: TicketScope) {
  try { localStorage.setItem(KEY, s); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(EVENT));
}

/** True when the ticket passes the scope. qaAccountIds = accountIds in the ticket's QA field. */
export function isMyTicket(scope: TicketScope, myAccountId: string | undefined, qaAccountIds: string[]): boolean {
  if (scope === "all") return true;
  return !!myAccountId && qaAccountIds.includes(myAccountId);
}
