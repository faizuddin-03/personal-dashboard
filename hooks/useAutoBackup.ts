"use client";
import { useEffect } from "react";
import { getBackupSettings, saveBackupSettings } from "@/lib/kanban";
import { exportLocalStorage } from "@/lib/jira";

export function useAutoBackup() {
  useEffect(() => {
    function check() {
      const settings = getBackupSettings();
      if (!settings.enabled) return;

      const now = new Date();
      if (now.getDay() !== 5) return; // Must be Friday

      const [hours, minutes] = settings.time.split(":").map(Number);
      if (now.getHours() < hours || (now.getHours() === hours && now.getMinutes() < minutes)) return;

      const today = now.toISOString().slice(0, 10);
      if (settings.lastBackupDate === today) return; // Already backed up today

      if (settings.lastBackupDate) {
        const last = new Date(settings.lastBackupDate);
        const daysSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < settings.intervalWeeks * 7 - 1) return;
      }

      exportLocalStorage();
      saveBackupSettings({ ...settings, lastBackupDate: today });
    }

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);
}
