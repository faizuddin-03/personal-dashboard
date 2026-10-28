// Types for scripts/pipeline/lib/quote-check.mjs (night enhancement round 29).
export declare function normQuote(s: string): string;
export declare function quoteIn(quote: string, source: string): { ok: boolean; missing: string[] };
export declare function srdText(srdFile: string): string;
