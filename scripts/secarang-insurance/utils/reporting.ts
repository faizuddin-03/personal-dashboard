import * as fs from 'fs';
import * as path from 'path';
import { Page } from '@playwright/test';
import {
  StepResult, Screenshot, PostcodeChangeInfo, RegressionResult,
} from '../data/types';
import type { VerificationData } from '../pages/PaymentSuccessPage';

// ── Regression run reporter ─────────────────────────────────
// Collects step results + screenshots and writes regression-result.json,
// which the dashboard's /api/secarang/regression route reads and displays.
export class RegressionReporter {
  private steps: StepResult[] = [];
  private screenshots: Screenshot[] = [];
  private startedAt = new Date().toISOString();

  verificationReport = '';
  verificationData?: VerificationData;
  postcodeChangeInfo?: PostcodeChangeInfo;

  constructor(
    private readonly meta: { vehicleNumber: string; icNumber: string; targetInsurer: string },
    private readonly outputFile: string,
  ) {}

  start(): void {
    this.startedAt = new Date().toISOString();
  }

  recordStep(name: string, status: StepResult['status'], message: string): void {
    const s: StepResult = { name, status, message, timestamp: new Date().toISOString() };
    this.steps.push(s);
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${icon} [${status}] ${name}: ${message}`);
  }

  async captureScreenshot(page: Page, label: string): Promise<void> {
    try {
      const buf = await page.screenshot({ type: 'jpeg', quality: 55, fullPage: true });
      this.screenshots.push({ label, dataUrl: `data:image/jpeg;base64,${buf.toString('base64')}` });
      console.log(`   📷 Screenshot: "${label}" (${Math.round(buf.length / 1024)} KB)`);
    } catch (e) {
      console.log(`   ⚠️  Screenshot failed for "${label}": ${e}`);
    }
  }

  writeResult(overallStatus: 'PASS' | 'FAIL', errorMessage?: string): void {
    const completedAt = new Date().toISOString();
    const result: RegressionResult = {
      vehicleNumber:  this.meta.vehicleNumber,
      icNumber:       this.meta.icNumber,
      targetInsurer:  this.meta.targetInsurer,
      overallStatus,
      steps: this.steps,
      errorMessage,
      startedAt: this.startedAt,
      completedAt,
      durationMs:         new Date(completedAt).getTime() - new Date(this.startedAt).getTime(),
      verificationReport: this.verificationReport || undefined,
      verificationData:   this.verificationData   || undefined,
      postcodeChangeInfo: this.postcodeChangeInfo || undefined,
      screenshots:        this.screenshots.length ? this.screenshots : undefined,
    };
    const outPath = path.resolve(this.outputFile);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`\n📁 Result written to: ${outPath}`);
  }
}
