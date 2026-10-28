"use client";
// Jira deployment calendar cache + auto-sync, shared by the Calendar page and
// the dashboard's Upcoming Deployments widget so both show the same tickets.
import { useCallback, useEffect, useRef, useState } from "react";
import type { JiraCredentials } from "@/lib/jira";
import { JIRA_DEPLOY_CACHE_VERSION, JIRA_DEPLOY_STALE_MS, JiraDeployTicket, syncJiraDeploys } from "@/lib/jiraDeployCalendar";
import { useJiraDeploys, writeJiraDeploys } from "./store";

const NO_TICKETS: JiraDeployTicket[] = [];

/** Reads the cached Jira deployment tickets and re-syncs once on mount when stale. */
export function useJiraDeploySync(creds: JiraCredentials | null, todayStr: string) {
  const cache = useJiraDeploys();
  const [syncing, setSyncing] = useState(false);
  const sync = useCallback(async () => {
    setSyncing(true);
    try { writeJiraDeploys(await syncJiraDeploys(creds, todayStr)); }
    finally { setSyncing(false); }
  }, [creds, todayStr]);
  const autoSynced = useRef(false);
  useEffect(() => {
    if (autoSynced.current || !creds?.apiToken) return;
    const age = cache?.syncedAt ? Date.now() - Date.parse(cache.syncedAt) : Infinity;
    if (age < JIRA_DEPLOY_STALE_MS && cache?.v === JIRA_DEPLOY_CACHE_VERSION) { autoSynced.current = true; return; }
    // Deferred so the sync's state updates happen outside the effect body.
    const t = setTimeout(() => { autoSynced.current = true; void sync(); }, 0);
    return () => clearTimeout(t);
  }, [creds, cache, sync]);
  return { cache, tickets: cache?.tickets ?? NO_TICKETS, syncing, sync };
}
