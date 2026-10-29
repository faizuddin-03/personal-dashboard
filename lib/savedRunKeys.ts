// Run keys of the eAuto tool pages whose last result is saved on the server
// (lib/server/savedResults.ts) and restored by hooks/useBackgroundRuns.ts —
// the tools not tied to a TS (Faizuddin, 2026-10-21). Shopping Cart, Insurance
// Purchase E2E and Secarang Regression are test runs and keep their recording,
// so they are not here.
//
// Insurance availability (eAuto / Secarang) runs through AppShell's own jobs,
// not useBackgroundRuns; its two keys are listed here too and read there.

export const SAVED_RESULT_KEYS: string[] = [
  "eauto/estm",
  "eauto/bdp-creator",
  "eauto/preapp",
  "eauto/esim",
  "eauto/company-details-checker",
  "secarang-plate-checker",
  "insurance/eauto-availability",
  "insurance/secarang-availability",
];

export const isSavedResultKey = (key: string) => SAVED_RESULT_KEYS.includes(key);
