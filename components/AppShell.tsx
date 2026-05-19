"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { JiraCredentials, getStoredCredentials, clearCredentials } from "@/lib/jira";
import { useAutoBackup } from "@/hooks/useAutoBackup";

interface AppCtx {
  creds: JiraCredentials | null;
  setCreds: (c: JiraCredentials | null) => void;
  openSettings: () => void;
}

export const AppContext = createContext<AppCtx>({
  creds: null,
  setCreds: () => {},
  openSettings: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [creds, setCreds] = useState<JiraCredentials | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  useAutoBackup();

  useEffect(() => {
    setCreds(getStoredCredentials());
    setHydrated(true);
  }, []);

  function handleLogout() {
    clearCredentials();
    setCreds(null);
  }

  function openSettings() {
    router.push("/settings");
  }

  if (!hydrated) return null;

  return (
    <AppContext.Provider value={{ creds, setCreds, openSettings }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar onLogout={handleLogout} isConnected={!!creds} />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </AppContext.Provider>
  );
}
