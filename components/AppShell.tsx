"use client";
import { useState, useEffect, createContext, useContext } from "react";
import Sidebar from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";
import { JiraCredentials, getStoredCredentials, clearCredentials } from "@/lib/jira";

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
  const [showSettings, setShowSettings] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCreds(getStoredCredentials());
    setHydrated(true);
  }, []);

  function handleLogout() {
    clearCredentials();
    setCreds(null);
  }

  if (!hydrated) return null;

  return (
    <AppContext.Provider value={{ creds, setCreds, openSettings: () => setShowSettings(true) }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          onSettingsClick={() => setShowSettings(true)}
          onLogout={handleLogout}
          isConnected={!!creds}
        />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>

      {showSettings && (
        <SettingsModal
          initial={creds}
          onClose={() => setShowSettings(false)}
          onSaved={(c) => {
            setCreds(c);
            setShowSettings(false);
          }}
        />
      )}
    </AppContext.Provider>
  );
}
