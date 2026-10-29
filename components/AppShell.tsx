"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import WhatsNewModal from "@/components/WhatsNewModal";
import NavigationLoader, { LoadingOverlay } from "@/components/NavigationLoader";
import FloatingLayer from "@/components/floating/FloatingLayer";
import { JiraCredentials, getStoredCredentials, storeCredentials } from "@/lib/jira";
import { CURRENT_CHANGES } from "@/lib/changelog";
import { InsuranceJob, InsuranceRunParams, saveInsuranceResults } from "@/lib/insurance";
import { SecarangJob, SecarangRunParams, SecarangRow, saveSecarangResults, saveRegressionSecarangResults } from "@/lib/secarang";
import { useAutoBackup } from "@/hooks/useAutoBackup";
import { useBackgroundRuns, type RunMap, type StartRunOptions } from "@/hooks/useBackgroundRuns";
import { loadAndApplyTheme } from "@/lib/themes";
import HistoryButtons from "@/components/HistoryButtons";
import clsx from "clsx";
import PipelineRunWatcher from "@/components/pipeline/PipelineRunWatcher";

interface AppCtx {
  creds: JiraCredentials | null;
  setCreds: (c: JiraCredentials | null) => void;
  openSettings: () => void;
  openSearch: () => void;
  openWhatsNew: () => void;
  insuranceJob: InsuranceJob | null;
  startInsuranceRun: (params: InsuranceRunParams) => void;
  stopInsuranceRun: () => void;
  clearInsuranceJob: () => void;
  restoreInsuranceJob: (job: InsuranceJob) => void;
  secarangJob: SecarangJob | null;
  startSecarangRun: (params: SecarangRunParams) => void;
  stopSecarangRun: () => void;
  clearSecarangJob: () => void;
  restoreSecarangJob: (job: SecarangJob) => void;
  regressionSecarangJob: SecarangJob | null;
  startRegressionSecarangRun: (params: SecarangRunParams) => void;
  stopRegressionSecarangRun: () => void;
  clearRegressionSecarangJob: () => void;
  restoreRegressionSecarangJob: (job: SecarangJob) => void;
  /**
   * Runner state that survives navigating away, keyed by page. Insurance and
   * Secarang above are the hand-rolled originals; anything new should use this
   * instead of owning its own fetch. See hooks/useBackgroundRuns.ts.
   */
  runs: RunMap;
  startRun: <T>(key: string, opts: StartRunOptions) => string;
  stopRun: (key: string) => void;
  clearRun: (key: string) => void;
}

export const AppContext = createContext<AppCtx>({
  creds: null,
  setCreds: () => {},
  openSettings: () => {},
  openSearch: () => {},
  openWhatsNew: () => {},
  insuranceJob: null,
  startInsuranceRun: () => {},
  stopInsuranceRun: () => {},
  clearInsuranceJob: () => {},
  restoreInsuranceJob: () => {},
  secarangJob: null,
  startSecarangRun: () => {},
  stopSecarangRun: () => {},
  clearSecarangJob: () => {},
  restoreSecarangJob: () => {},
  regressionSecarangJob: null,
  startRegressionSecarangRun: () => {},
  stopRegressionSecarangRun: () => {},
  clearRegressionSecarangJob: () => {},
  restoreRegressionSecarangJob: () => {},
  runs: {},
  startRun: () => "",
  stopRun: () => {},
  clearRun: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [creds, setCreds] = useState<JiraCredentials | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [insuranceJob,          setInsuranceJob]          = useState<InsuranceJob | null>(null);
  const [secarangJob,           setSecarangJob]           = useState<SecarangJob  | null>(null);
  const [regressionSecarangJob, setRegressionSecarangJob] = useState<SecarangJob  | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  // Page tag for the Medieval style sheets (app/styles/medieval/*.css):
  // "/" -> "home", "/eauto/12153" -> "eauto-12153", "/jira/EAINT-1" -> "jira-key".
  useEffect(() => {
    const parts = (pathname ?? "/").split("/").filter(Boolean);
    if (parts[0] === "jira" && parts[1] && !["filter", "mentions", "studies"].includes(parts[1])) parts[1] = "key";
    document.documentElement.setAttribute("data-page", parts.slice(0, 2).join("-") || "home");
  }, [pathname]);

  /** Polls the server's saved result (lib/server/savedResults.ts) for a run whose
   *  request was cut off, until one newer than `startedAt` arrives (6 h max). */
  function waitForSavedResult(key: string, startedAt: number, onFound: (payload: unknown) => void, onGiveUp: () => void) {
    const until = Date.now() + 6 * 60 * 60 * 1000;
    const tick = () => {
      fetch(`/api/saved-results?key=${encodeURIComponent(key)}`).then(r => r.json())
        .then((d: { saved: { savedAt: string; payload: unknown } | null }) => {
          if (d.saved && new Date(d.saved.savedAt).getTime() > startedAt) return onFound(d.saved.payload);
          if (Date.now() > until) return onGiveUp();
          setTimeout(tick, 15_000);
        })
        .catch(() => { if (Date.now() > until) onGiveUp(); else setTimeout(tick, 15_000); });
    };
    tick();
  }

  function startInsuranceRun(params: InsuranceRunParams) {
    // Called with no vehicles = just restore display state from saved results, no fetch
    if (!params.vehicles.length) return;
    const startedAt = Date.now();
    setInsuranceJob({
      loading: true, rows: [], error: "", log: "", savedAt: null,
      vehicleInput: params.vehicleInput,
      username: params.usernameDisplay,
      baseUrl: params.baseUrlDisplay,
    });
    fetch("/api/insurance/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicles:        params.vehicles,
        username:        params.username,
        password:        params.password,
        icNumber:        params.icNumber,
        postcode:        params.postcode,
        vehicleCategory: params.vehicleCategory,
        baseUrl:         params.baseUrl,
        concurrency:     params.concurrency,
        saveKey:         "insurance/eauto-availability",
      }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then(data => {
        const now = new Date().toISOString();
        const rows = data.rows ?? [];
        const log  = data.log ?? "";
        if (data.error) throw new Error(data.error);
        setInsuranceJob(j => j ? { ...j, loading: false, stopping: false, rows, log, savedAt: now } : null);
        saveInsuranceResults({
          rows, runLog: log, savedAt: now,
          vehicleInput: params.vehicleInput,
          username: params.usernameDisplay,
          baseUrl: params.baseUrlDisplay,
        });
      })
      .catch(e => {
        // Request cut off (laptop asleep): the run goes on — wait for its saved result.
        if (e instanceof TypeError) {
          waitForSavedResult("insurance/eauto-availability", startedAt, (payload) => {
            const rows = (payload as { rows?: InsuranceJob["rows"] }).rows ?? [];
            const log = (payload as { log?: string }).log ?? "";
            const now = new Date().toISOString();
            setInsuranceJob(j => j ? { ...j, loading: false, stopping: false, rows, log, savedAt: now } : null);
            saveInsuranceResults({ rows, runLog: log, savedAt: now, vehicleInput: params.vehicleInput, username: params.usernameDisplay, baseUrl: params.baseUrlDisplay });
          }, () => setInsuranceJob(j => j ? { ...j, loading: false, stopping: false, error: "Lost contact with the run and no saved result arrived." } : null));
          return;
        }
        setInsuranceJob(j => j ? { ...j, loading: false, stopping: false, error: e instanceof Error ? e.message : "Something went wrong" } : null);
      });
  }

  function stopInsuranceRun() {
    // Mark as stopping for immediate UI feedback; the pending POST resolves
    // on its own with whatever partial results were flushed to disk.
    setInsuranceJob(j => j ? { ...j, stopping: true } : null);
    fetch("/api/insurance/check", { method: "DELETE" }).catch(() => {});
  }

  function clearInsuranceJob() {
    setInsuranceJob(null);
  }

  function restoreInsuranceJob(job: InsuranceJob) {
    setInsuranceJob(job);
  }

  function startSecarangRun(params: SecarangRunParams) {
    if (!params.vehicles.length) return;
    const startedAt = Date.now();
    setSecarangJob({
      loading: true, stopping: false, rows: [], error: "", log: "",
      savedAt: null, vehicleInput: params.vehicleInput,
    });
    fetch("/api/secarang/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicles:            params.vehicles,
        icNumber:            params.icNumber,
        postcode:            params.postcode,
        vehicleType:         params.vehicleType,
        ownerType:           params.ownerType,
        baseUrl:             params.baseUrl,
        sitePassword:        params.sitePassword,
        concurrency:         params.concurrency,
        checkVehicleDetails: params.checkVehicleDetails,
        saveKey:             "insurance/secarang-availability",
      }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then(data => {
        const now  = new Date().toISOString();
        const rows: SecarangRow[] = data.rows ?? [];
        const log  = data.log ?? "";
        if (data.error) throw new Error(data.error);
        setSecarangJob(j => j ? { ...j, loading: false, stopping: false, rows, log, savedAt: now } : null);
        saveSecarangResults({ rows, runLog: log, savedAt: now, vehicleInput: params.vehicleInput });
      })
      .catch(e => {
        // Request cut off (laptop asleep): the run goes on — wait for its saved result.
        if (e instanceof TypeError) {
          waitForSavedResult("insurance/secarang-availability", startedAt, (payload) => {
            const rows: SecarangRow[] = (payload as { rows?: SecarangRow[] }).rows ?? [];
            const log = (payload as { log?: string }).log ?? "";
            const now = new Date().toISOString();
            setSecarangJob(j => j ? { ...j, loading: false, stopping: false, rows, log, savedAt: now } : null);
            saveSecarangResults({ rows, runLog: log, savedAt: now, vehicleInput: params.vehicleInput });
          }, () => setSecarangJob(j => j ? { ...j, loading: false, stopping: false, error: "Lost contact with the run and no saved result arrived." } : null));
          return;
        }
        setSecarangJob(j => j ? { ...j, loading: false, stopping: false, error: e instanceof Error ? e.message : "Something went wrong" } : null);
      });
  }

  function stopSecarangRun() {
    setSecarangJob(j => j ? { ...j, stopping: true } : null);
    fetch("/api/secarang/check", { method: "DELETE" }).catch(() => {});
  }

  function clearSecarangJob() {
    setSecarangJob(null);
  }

  function restoreSecarangJob(job: SecarangJob) {
    setSecarangJob(job);
  }

  function startRegressionSecarangRun(params: SecarangRunParams) {
    if (!params.vehicles.length) return;
    setRegressionSecarangJob({
      loading: true, stopping: false, rows: [], error: "", log: "",
      savedAt: null, vehicleInput: params.vehicleInput,
    });
    fetch("/api/secarang/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicles:            params.vehicles,
        icNumber:            params.icNumber,
        postcode:            params.postcode,
        vehicleType:         params.vehicleType,
        ownerType:           params.ownerType,
        baseUrl:             params.baseUrl,
        sitePassword:        params.sitePassword,
        concurrency:         params.concurrency,
        checkVehicleDetails: params.checkVehicleDetails,
      }),
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then(data => {
        const now  = new Date().toISOString();
        const rows: SecarangRow[] = data.rows ?? [];
        const log  = data.log ?? "";
        if (data.error) throw new Error(data.error);
        setRegressionSecarangJob(j => j ? { ...j, loading: false, stopping: false, rows, log, savedAt: now } : null);
        saveRegressionSecarangResults({ rows, runLog: log, savedAt: now, vehicleInput: params.vehicleInput });
      })
      .catch(e => {
        setRegressionSecarangJob(j => j ? { ...j, loading: false, stopping: false, error: e instanceof Error ? e.message : "Something went wrong" } : null);
      });
  }

  function stopRegressionSecarangRun() {
    setRegressionSecarangJob(j => j ? { ...j, stopping: true } : null);
    fetch("/api/secarang/check", { method: "DELETE" }).catch(() => {});
  }

  function clearRegressionSecarangJob() {
    setRegressionSecarangJob(null);
  }

  function restoreRegressionSecarangJob(job: SecarangJob) {
    setRegressionSecarangJob(job);
  }

  const { runs, startRun, stopRun, clearRun } = useBackgroundRuns();

  useAutoBackup();

  useEffect(() => {
    const stored = getStoredCredentials();
    setCreds(stored);
    loadAndApplyTheme();
    setHydrated(true);
    if (!sessionStorage.getItem("whats_new_seen") && CURRENT_CHANGES.length > 0) {
      setWhatsNewOpen(true);
    }
    // If accountId isn't cached yet, fetch it now so reporter queries work reliably
    if (stored && !stored.accountId) {
      fetch("/api/jira/myself", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stored),
      })
        .then(r => r.json())
        .then(data => {
          if (data.accountId) {
            const updated = { ...stored, accountId: data.accountId as string };
            storeCredentials(updated);
            setCreds(updated);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Cmd+K wiring — also handled inside GlobalSearch but we expose openSearch via context
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(v => !v); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Until the shell has started, cover the screen instead of showing nothing.
  if (!hydrated) return <div className="h-screen bg-slate-950"><LoadingOverlay /></div>;

  return (
    <AppContext.Provider value={{
      creds, setCreds,
      openSettings: () => router.push("/settings"),
      openSearch: () => setSearchOpen(true),
      openWhatsNew: () => setWhatsNewOpen(true),
      insuranceJob, startInsuranceRun, stopInsuranceRun, clearInsuranceJob, restoreInsuranceJob,
      secarangJob, startSecarangRun, stopSecarangRun, clearSecarangJob, restoreSecarangJob,
      regressionSecarangJob, startRegressionSecarangRun, stopRegressionSecarangRun, clearRegressionSecarangJob, restoreRegressionSecarangJob,
      runs, startRun, stopRun, clearRun,
    }}>
      {/* overflow-clip, not -hidden: a hidden box can still be scrolled by
          scrollIntoView, which shifted the whole shell up (2026-10-27). */}
      <div className="flex h-screen overflow-clip">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — always visible on lg+, slide-in on mobile */}
        <div className={clsx(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar onClose={() => setSidebarOpen(false)} onSearch={() => setSearchOpen(true)} />
        </div>

        {/* Main area */}
        {/* min-w-0: unlike overflow-hidden, overflow-clip does not let a flex
            item shrink below its content, so wide pages (the pipeline board)
            stretched past the window and could not scroll. */}
        <div className="flex-1 min-w-0 flex flex-col overflow-clip">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center justify-between px-3 h-14 bg-slate-900 border-b border-slate-800 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-slate-200 p-2.5 rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors"
            >
              <Menu size={22} />
            </button>
            <HistoryButtons size={18} />
            <span className="flex-1 text-center text-base font-semibold text-slate-200">Udin&apos;s Board</span>
            <button
              onClick={() => setSearchOpen(true)}
              className="text-slate-400 hover:text-slate-200 p-2.5 rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors"
            >
              <Search size={20} />
            </button>
          </div>

          {/* relative: absolute children (sr-only labels, tooltips) with no
              positioned parent used the page as their box, escaped the clip
              and made the whole window scroll past the sidebar (2026-10-29). */}
          <main className="relative flex-1 overflow-y-auto bg-slate-950">
            {children}
          </main>
        </div>
      </div>

      {/* Page-to-page loading cover — blocks clicks until the new page is in place */}
      <FloatingLayer />
      <NavigationLoader />
      <PipelineRunWatcher />

      {/* Global search modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50"
          onClick={() => setSearchOpen(false)}
        >
          <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
      )}

      {/* What's New modal — auto-shown once per session */}
      {whatsNewOpen && (
        <WhatsNewModal onClose={() => {
          sessionStorage.setItem("whats_new_seen", "true");
          setWhatsNewOpen(false);
        }} />
      )}
    </AppContext.Provider>
  );
}
