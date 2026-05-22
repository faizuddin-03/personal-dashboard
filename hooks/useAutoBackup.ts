"use client";
import { useEffect } from "react";
import { getBackupSettings, saveBackupSettings } from "@/lib/kanban";
import { exportLocalStorage } from "@/lib/jira";

export function useAutoBackup() {
  useEffect(() => {
    function check() {
      const s = getBackupSettings();
      if (!s.enabled) return;

      const now = new Date();
      const day = now.getDay(); // 0=Sun, 6=Sat
      const isWeekday = day >= 1 && day <= 5;
      if (!isWeekday) return;

      const today = now.toISOString().slice(0, 10);
      const hour = now.getHours();

      if (s.schedule === "daily-5pm") {
        if (hour < 17) return;
        if (s.lastBackupDate === today) return;
        exportLocalStorage();
        saveBackupSettings({ ...s, lastBackupDate: today, lastBackupHour: null });
      } else if (s.schedule === "hourly") {
        if (hour < 8 || hour >= 18) return;
        if (s.lastBackupDate === today && s.lastBackupHour === hour) return;
        exportLocalStorage();
        saveBackupSettings({ ...s, lastBackupDate: today, lastBackupHour: hour });
      } else if (s.schedule === "weekly") {
        if (day !== 5) return;
        if (hour < 17) return;
        if (s.lastBackupDate === today) return;
        exportLocalStorage();
        saveBackupSettings({ ...s, lastBackupDate: today, lastBackupHour: null });
      } else if (s.schedule === "biweekly") {
        if (day !== 5) return;
        if (hour < 17) return;
        if (s.lastBackupDate === today) return;
        if (s.lastBackupDate) {
          const daysSince = (now.getTime() - new Date(s.lastBackupDate).getTime()) / 86_400_000;
          if (daysSince < 13) return;
        }
        exportLocalStorage();
        saveBackupSettings({ ...s, lastBackupDate: today, lastBackupHour: null });
      }
    }

    function onVisible() { if (!document.hidden) check(); }
    document.addEventListener("visibilitychange", onVisible);
    check();
    const id = setInterval(check, 60_000);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, []);
}
