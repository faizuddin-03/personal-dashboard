import { NextResponse } from "next/server";
import * as path from "node:path";
import * as fs from "node:fs";

const SCRIPT_DIR = process.env.SECARANG_SCRIPT_DIR
  ?? path.join(process.cwd(), "scripts", "secarang-insurance");
const LOG_FILE = path.join(SCRIPT_DIR, "regression-log.txt");

export async function GET() {
  try {
    const text = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, "utf-8") : "";
    return new NextResponse(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch {
    return new NextResponse("", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
