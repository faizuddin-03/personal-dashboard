"use client";
import { Car } from "lucide-react";
import AutomationCatalog, { byName } from "@/components/AutomationCatalog";
import { EAUTO_MODULES } from "@/lib/eautoModules";

// /eauto — every eAuto module page in one list, like /tickets. Replaces the
// sidebar eAuto dropdown (Faizuddin, 2026-10-21). Entries live in
// lib/eautoModules.ts.

export default function EautoModulesPage() {
  return (
    <AutomationCatalog
      title="eAuto"
      subtitle="Module tools and test-data helpers — {n} pages"
      icon={Car}
      items={EAUTO_MODULES}
      storageKey="eauto_modules_view"
      keyLabels={["Name (A → Z)", "Name (Z → A)"]}
      compareKey={byName}
      defaultSort="key-asc"
    />
  );
}
