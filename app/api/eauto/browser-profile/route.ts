import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// The saved eAuto browser profile used by 12153, 12257 and Create
// Pre-Application (scripts/*/utils/savedBrowser.ts). GET = is Chrome
// installed, which Google account is signed in, is the profile open right now.
// POST = open it in a NORMAL Chrome window (not automated) so the person can
// sign in to Google once — Google refuses sign-in in an automated browser.
// Faizuddin, 2026-10-22: reCAPTCHA asked every run because the old browser was
// never signed in to Google.

const PROFILE_DIR = path.join(process.cwd(), "data", "browser-profile", "eauto-onboarding-chrome");

function chromePath(): string | null {
  const candidates = [
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
    process.env["PROGRAMFILES(X86)"] && path.join(process.env["PROGRAMFILES(X86)"], "Google", "Chrome", "Application", "chrome.exe"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
  ].filter(Boolean) as string[];
  return candidates.find(p => fs.existsSync(p)) ?? null;
}

function googleAccount(): string | null {
  try {
    const prefs = JSON.parse(fs.readFileSync(path.join(PROFILE_DIR, "Default", "Preferences"), "utf8"));
    const acc = Array.isArray(prefs.account_info) ? prefs.account_info.find((a: { email?: string }) => a?.email) : null;
    return acc?.email ?? prefs?.google?.services?.last_username ?? null;
  } catch { return null; }
}

/** Chrome holds `lockfile` open (exclusive) while the profile is in use. */
function inUse(): boolean {
  const lock = path.join(PROFILE_DIR, "lockfile");
  if (!fs.existsSync(lock)) return false;
  try { fs.closeSync(fs.openSync(lock, "r+")); return false; } catch { return true; }
}

function status() {
  return { chromeFound: !!chromePath(), account: googleAccount(), open: inUse(), profileDir: PROFILE_DIR };
}

export async function GET() {
  return NextResponse.json(status());
}

export async function POST() {
  const exe = chromePath();
  if (!exe) return NextResponse.json({ ...status(), error: "Google Chrome is not installed in the usual place." }, { status: 404 });
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const child = spawn(exe, [`--user-data-dir=${PROFILE_DIR}`, "--no-first-run", "--no-default-browser-check", "https://accounts.google.com/"], {
    detached: true, stdio: "ignore", windowsHide: false,
  });
  child.unref();
  return NextResponse.json(status());
}
