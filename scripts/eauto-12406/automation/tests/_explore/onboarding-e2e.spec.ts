// NOT A TEST — the onboarding build. Public Pre-Application form to a paid,
// verified Application, as resumable phases (src/flows/onboarding.flow.ts).
//
//   A fresh build — seeds its own company, ONE reCAPTCHA tick, then unattended:
//     HEADED=1 npm run onboard
//
//   Resume a build that stopped (a checkpoint is written after every phase):
//     ONB_RESUME=latest npm run onboard
//     ONB_RESUME=onb-260923-1412 ONB_FROM=regdocs npm run onboard
//     ONB_RESUME=onb-260923-1412 ONB_ONLY=record npm run onboard
//
//   Park a record at an intermediate state on purpose:
//     HEADED=1 ONB_UNTIL=submit-approval npm run onboard
//
//   Take over a record someone else built (read-only lookup, then carry on):
//     ONB_ADOPT=P260922/00869 ONB_FROM=regdocs npm run onboard
//
//   How long a fresh build waits for the reCAPTCHA tick (default 10 minutes):
//     ONB_GATE_MINUTES=15
//
//   Which company. SSM builds take a REAL ROC / new ROC / TIN trio from
//   env/test-companies.local.json (gitignored) — the first one not yet used,
//   or the one named. ONB_TYPE narrows the pick to that type:
//     ONB_COMPANY=202301012345 npm run onboard
//     ONB_COMPANY=generated npm run onboard      (invented company; TIN will fail)
//   Naming a company AND a type reuses its trio as that type, on purpose:
//     ONB_COMPANY=CA0339219-V ONB_TYPE=LLP npm run onboard
//
//   Company shape for a fresh build (SSM types are seeded into eSim):
//     ONB_TYPE=ROC|ROB|LLP  ONB_DIRECTORS=2  ONB_SECRETARIES  ONB_SHAREHOLDERS  ONB_FOREIGN
//   Business Trading instead (no SSM record, a licence and its upload):
//     ONB_TYPE=SARAWAK|SABAH
//
// It CREATES records and moves them through real workflow on staging. Nothing
// here is reversible, and no real money moves (Fiuu sandbox, host-locked).
// It stops one step short of Registered, on purpose — see the flow header.
import { test } from "@fixtures";
import { newLabel, readCheckpoint, listCheckpoints, saveCheckpoint } from "@fixtures/checkpoint";
import {
  runOnboarding,
  adoptRecord,
  closeOnboardingRun,
  ONBOARDING_PHASES,
  type OnboardingCheckpoint,
  type OnboardingPhase,
  type OnboardingRun,
} from "@flows/onboarding.flow";
import { ONBOARDING_TYPE, type OnboardingType } from "@data/onboarding-profile";

const env = (k: string) => (process.env[k] ?? "").trim() || undefined;

function phaseEnv(k: string): OnboardingPhase | undefined {
  const v = env(k);
  if (v && !(ONBOARDING_PHASES as readonly string[]).includes(v)) {
    throw new Error(`${k}=${v} is not a phase. Phases: ${ONBOARDING_PHASES.join(", ")}`);
  }
  return v as OnboardingPhase | undefined;
}

function onboardingType(): OnboardingType | undefined {
  if (!env("ONB_TYPE")) return undefined;
  const v = env("ONB_TYPE")!.toUpperCase();
  if (!(v in ONBOARDING_TYPE)) throw new Error(`ONB_TYPE=${v} — use one of ${Object.keys(ONBOARDING_TYPE).join(", ")}.`);
  return v as OnboardingType;
}

function checkpointFor(): OnboardingCheckpoint {
  const resume = env("ONB_RESUME");
  if (resume) {
    const label = resume === "latest" ? listCheckpoints()[0] : resume;
    if (!label) throw new Error("ONB_RESUME=latest, but there is no checkpoint yet.");
    return readCheckpoint(label);
  }
  const now = new Date().toISOString();
  return saveCheckpoint({ label: newLabel(), createdAt: now, updatedAt: now, profile: {} as never, phases: {} });
}

test("onboarding build", async ({ browser, context }) => {
  // The gate wait is a person's time; the phases after it need their own.
  const gateMinutes = Number(env("ONB_GATE_MINUTES") ?? 10);
  test.setTimeout((gateMinutes + 30) * 60_000);

  const run: OnboardingRun = {
    browser,
    dealer: context,
    cp: checkpointFor(),
    log: (line) => console.log(`  ${line}`),
    gateTimeoutMs: gateMinutes * 60_000,
    videoDir: test.info().project.use.video !== "off" ? test.info().outputDir : undefined,
    seed: {
      type: onboardingType(),
      company: env("ONB_COMPANY"),
      directors: Number(env("ONB_DIRECTORS") ?? 2),
      secretaries: Number(env("ONB_SECRETARIES") ?? 0),
      shareholders: Number(env("ONB_SHAREHOLDERS") ?? 0),
      foreign: Number(env("ONB_FOREIGN") ?? 0),
    },
  };
  console.log(`\n=== checkpoint ${run.cp.label} ===`);
  test.info().annotations.push({ type: "checkpoint", description: run.cp.label });

  try {
    const adopt = env("ONB_ADOPT");
    if (adopt) {
      if (!env("ONB_FROM") && !env("ONB_ONLY")) {
        throw new Error("ONB_ADOPT needs ONB_FROM or ONB_ONLY — an adopted record's earlier phases were not run here.");
      }
      await adoptRecord(run, adopt);
    }

    const results = await runOnboarding(run, {
      from: phaseEnv("ONB_FROM"),
      until: phaseEnv("ONB_UNTIL"),
      only: phaseEnv("ONB_ONLY"),
    });

    const cp = run.cp;
    console.log(`\n=== ${cp.label} ===`);
    console.log(`  pre-application  ${cp.preAppNo ?? "-"}`);
    console.log(`  application      ${cp.applicationNo ?? "-"}  (${cp.uuid ?? "no uuid"})`);
    console.log(`  phases run       ${Object.keys(results).join(" → ") || "(none)"}`);
    test.info().annotations.push(
      { type: "pre-application-no", description: cp.preAppNo ?? "" },
      { type: "application-no", description: cp.applicationNo ?? "" },
    );
  } finally {
    await closeOnboardingRun(run);
  }
});
