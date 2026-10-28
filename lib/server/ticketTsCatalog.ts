import * as fs from "node:fs";
import * as path from "node:path";
import ts from "typescript";
import { TICKET_AUTOMATIONS } from "@/lib/ticketAutomations";
import type { TicketTsCatalog, CatalogCR, CatalogTs } from "@/lib/tsTrackerTally";

// Reads the TS list of every ticket automation page straight from its source,
// so the TS Tracker always tallies with /tickets without a second copy of the
// list to keep in step (Faizuddin, 2026-10-22: "make the TS tracker
// automatically tally with the tickets page").
//
// Each page keeps `const SCENARIOS = [...]` (and usually `const TS_SECTIONS`)
// in its own .tsx. Those files are pages, so they cannot export the arrays;
// instead this parses them with the TypeScript compiler and reads the plain
// string / number / boolean fields of each entry. Nothing is executed. A
// scenario counts as a TS when its title carries a TS id ("12107_TS05: …",
// "12166_67_E2E_TS01"); setup / guide / video rows are skipped.

const TS_ID_RE = /\b((?:\d+_)?(?:[A-Z0-9]+_)*TS\d+)\b/i;

type Lit = string | number | boolean;

function literal(node: ts.Expression): Lit | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) return literal(node.expression);
  return undefined;
}

function objectFields(node: ts.ObjectLiteralExpression): Record<string, Lit> {
  const out: Record<string, Lit> = {};
  for (const p of node.properties) {
    if (!ts.isPropertyAssignment(p)) continue;
    const name = ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text : null;
    if (!name) continue;
    const v = literal(p.initializer);
    if (v !== undefined) out[name] = v;
  }
  return out;
}

/** The object entries of `const <name> = [ {…}, … ]` (with or without `as const` / a type). */
function arrayOf(file: ts.SourceFile, name: string): Record<string, Lit>[] | null {
  let found: Record<string, Lit>[] | null = null;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer) {
      let init: ts.Expression = node.initializer;
      while (ts.isAsExpression(init) || ts.isParenthesizedExpression(init)) init = init.expression;
      if (ts.isArrayLiteralExpression(init)) {
        found = init.elements.filter(ts.isObjectLiteralExpression).map(objectFields);
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

function sourceFiles(href: string): string[] {
  const dir = path.join(process.cwd(), "app", ...href.split("/").filter(Boolean));
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith(".tsx") || f.endsWith(".ts")).map(f => path.join(dir, f));
  } catch { return []; }
}

/** "12107_TS05" in EAINT-12107 → "TS05"; ids with more in the middle stay whole. */
function trackerNumber(tsId: string, crKey: string): string {
  const crNo = crKey.match(/-(\d+)$/)?.[1];
  if (crNo && tsId.startsWith(crNo + "_")) {
    const rest = tsId.slice(crNo.length + 1);
    if (/^TS\d+$/i.test(rest)) return rest.toUpperCase();
  }
  return tsId.toUpperCase();
}

export function buildTicketTsCatalog(): TicketTsCatalog {
  const crs = new Map<string, CatalogCR>();
  const crFor = (key: string, page: string): CatalogCR => {
    let cr = crs.get(key);
    if (!cr) { cr = { crKey: key, pages: [], suites: [] }; crs.set(key, cr); }
    if (!cr.pages.includes(page)) cr.pages.push(page);
    return cr;
  };

  for (const page of TICKET_AUTOMATIONS) {
    // Every ticket on /tickets gets a CR, with or without a TS list.
    for (const k of page.keys) crFor(k, page.href);

    for (const file of sourceFiles(page.href)) {
      let text: string;
      try { text = fs.readFileSync(file, "utf8"); } catch { continue; }
      if (!/\bSCENARIOS\b/.test(text)) continue;
      const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
      const scenarios = arrayOf(sf, "SCENARIOS");
      if (!scenarios) continue;
      const sections = new Map<string, string>();
      for (const s of arrayOf(sf, "TS_SECTIONS") ?? []) {
        if (typeof s.letter === "string" && typeof s.title === "string") sections.set(s.letter, s.title);
      }

      const rows = scenarios
        .filter(s => typeof s.title === "string" && (s.kind === undefined || s.kind === "ts"))
        .map((s, i) => ({ s, i, order: typeof s.order === "number" ? s.order : 1000 + i }))
        .sort((a, b) => a.order - b.order);

      for (const { s } of rows) {
        const title = s.title as string;
        const tsId = title.match(TS_ID_RE)?.[1]?.toUpperCase();
        if (!tsId) continue;
        const prefix = tsId.match(/^(\d{4,})_/)?.[1];
        const crKey = page.keys.find(k => prefix && k.endsWith("-" + prefix)) ?? page.keys[0];
        if (!crKey) continue;
        const colon = title.indexOf(":");
        const objective = (colon >= 0 ? title.slice(colon + 1).trim() : "") || (typeof s.summary === "string" ? s.summary : "");
        const suiteTitle = (typeof s.section === "string" && sections.get(s.section)) || "Automation";
        const entry: CatalogTs = {
          tsNumber: trackerNumber(tsId, crKey),
          tsId,
          objective,
          manualOnly: s.notBuilt === true,
          deprio: s.deprio === true,
        };
        const cr = crFor(crKey, page.href);
        let suite = cr.suites.find(x => x.title === suiteTitle);
        if (!suite) { suite = { title: suiteTitle, cases: [] }; cr.suites.push(suite); }
        if (!suite.cases.some(c => c.tsId === tsId)) suite.cases.push(entry);
      }
    }
  }
  return { builtAt: new Date().toISOString(), crs: [...crs.values()] };
}
