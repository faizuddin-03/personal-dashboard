import type {
  Reporter,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import fs from 'fs';

/**
 * Emits a per-test STEP TREE to the file named by PW_STEP_REPORT.
 *
 * Ported verbatim from tests/service-hub/reporters/step-reporter.ts, per
 * Faizuddin's 2026-09-30 standing rule: 12166/12167 are the benchmark for
 * every eauto-* automation project's standard flow (highlighted/slowed demo
 * mode + a step-by-step reviewable log), not just this one suite's own
 * convention.
 */

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
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
