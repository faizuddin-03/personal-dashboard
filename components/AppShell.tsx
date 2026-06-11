"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import WhatsNewModal from "@/components/WhatsNewModal";
import { JiraCredentials, getStoredCredentials, storeCredentials } from "@/lib/jira";
import { CURRENT_CHANGES } from "@/lib/changelog";
import { InsuranceJob, InsuranceRunParams, saveInsuranceResults } from "@/lib/insurance";
import { SecarangJob, SecarangRunParams, SecarangRow, saveSecarangResults } from "@/lib/secarang";
import { useAutoBackup } from "@/hooks/useAutoBackup";
import { loadAndApplyTheme } from "@/lib/themes";
import clsx from "clsx";

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
  const [insuranceJob, setInsuranceJob] = useState<InsuranceJob | null>(null);
  const [secarangJob,  setSecarangJob]  = useState<SecarangJob  | null>(null);
  const router = useRouter();

  function startInsuranceRun(params: InsuranceRunParams) {
    // Called with no vehicles = just restore display state from saved results, no fetch
    if (!params.vehicles.length) return;
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
      }),
    })
      .then(r => r.json())
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
      }),
    })
      .then(r => r.json())
      .then(data => {
        const now  = new Date().toISOString();
        const rows: SecarangRow[] = data.rows ?? [];
        const log  = data.log ?? "";
        if (data.error) throw new Error(data.error);
        setSecarangJob(j => j ? { ...j, loading: false, stopping: false, rows, log, savedAt: now } : null);
        saveSecarangResults({ rows, runLog: log, savedAt: now, vehicleInput: params.vehicleInput });
      })
      .catch(e => {
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

  if (!hydrated) return null;

  return (
    <AppContext.Provider value={{
      creds, setCreds,
      openSettings: () => router.push("/settings"),
      openSearch: () => setSearchOpen(true),
      openWhatsNew: () => setWhatsNewOpen(true),
      insuranceJob, startInsuranceRun, stopInsuranceRun, clearInsuranceJob, restoreInsuranceJob,
      secarangJob, startSecarangRun, stopSecarangRun, clearSecarangJob, restoreSecarangJob,
    }}>
      <div className="flex h-screen overflow-hidden">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center justify-between px-3 h-14 bg-slate-900 border-b border-slate-800 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-slate-200 p-2.5 rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors"
            >
              <Menu size={22} />
            </button>
            <span className="text-base font-semibold text-slate-200">Udin's Board</span>
            <button
              onClick={() => setSearchOpen(true)}
              className="text-slate-400 hover:text-slate-200 p-2.5 rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors"
            >
              <Search size={20} />
            </button>
          </div>

          <main className="flex-1 overflow-y-auto bg-slate-950">
            {children}
          </main>
        </div>
      </div>

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
