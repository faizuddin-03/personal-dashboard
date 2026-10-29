import type {
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from "@playwright/test/reporter";
import fs from "fs";

/**
 * Emits a per-test STEP TREE to the file named by PW_STEP_REPORT.
 *
 * The built-in `json` reporter doesn't include steps, so the runner UI can't
 * show a per-step pass/fail checklist from it alone. This reporter serializes
 * `result.steps` (which includes every `test.step(...)` plus auto-recorded
 * `expect`/`pw:api` steps) so the API can merge it into each test result.
 */

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

interface SerStep {
  title: string;
  category: string; // "test.step" | "expect" | "pw:api" | "hook" | "fixture"
  duration: number;
  error?: string;
  steps: SerStep[];
}

interface SerTest {
  title: string; // leaf title
  titlePath: string[]; // [project, file, ...describe, test]
  status: string;
  duration: number;
  error?: string;
  steps: SerStep[];
}

function serStep(step: TestStep): SerStep {
  return {
    title: step.title,
    category: step.category,
    duration: step.duration,
    error: step.error?.message ? stripAnsi(step.error.message).slice(0, 800) : undefined,
    steps: (step.steps ?? []).map(serStep),
  };
}

export default class StepReporter implements Reporter {
  private tests: SerTest[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    this.tests.push({
      title: test.title,
      titlePath: test.titlePath(),
      status: result.status,
      duration: result.duration,
      error: result.error?.message ? stripAnsi(result.error.message).slice(0, 2000) : undefined,
      steps: (result.steps ?? []).map(serStep),
    });
  }

  async onEnd() {
    const out = process.env.PW_STEP_REPORT;
    if (!out) return;
    try {
      fs.writeFileSync(out, JSON.stringify({ tests: this.tests }));
    } catch {
      // best-effort — never break the run over reporting
    }
  }
}
