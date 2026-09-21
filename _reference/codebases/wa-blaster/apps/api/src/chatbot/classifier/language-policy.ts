/**
 * Deterministic reply-language policy: the bot replies in Bahasa Malaysia ONLY when the customer's
 * message is written entirely in BM. Any English sentence structure (Manglish, code-switching,
 * mostly-English with Malay loanwords like "kena") gets an English reply.
 *
 * This guards against the LLM classifier tagging mixed-language messages as "ms" — its verdict is
 * treated as a hint that this rule can only downgrade to "en", never upgrade to "ms".
 */

/**
 * English function/structure words that BM writers do not use when writing entirely in BM.
 * Deliberately excludes:
 *  - loanwords Malaysians embed in BM sentences (claim, cover, plan, order, insurance, ok, thanks)
 *  - ambiguous micro-tokens that collide with abbreviations or times (a, an, am, may, no, in, on, at, to, of)
 */
const ENGLISH_MARKERS = new Set([
  // pronouns & possessives
  'i', 'you', 'u', 'he', 'she', 'we', 'they', 'it', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'our', 'their', 'its', 'mine', 'yours',
  // auxiliaries & copulas
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'done', 'doing',
  'have', 'has', 'had', 'having',
  'can', 'could', 'will', 'would', 'shall', 'should', 'must', 'might',
  // negation
  'not', 'never', 'cannot',
  "don't", "didn't", "doesn't", "can't", "won't", "isn't", "aren't", "haven't", "hasn't",
  "wouldn't", "shouldn't", "couldn't",
  'dont', 'didnt', 'doesnt', 'cant', 'wont', 'isnt', 'arent', 'havent', 'hasnt',
  'wouldnt', 'shouldnt', 'couldnt',
  // articles & demonstratives
  'the', 'this', 'that', 'these', 'those', 'there', 'here',
  // wh-words
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  // conjunctions & prepositions
  'and', 'or', 'but', 'if', 'because', 'with', 'without', 'for', 'from', 'about',
  'after', 'before', 'between', 'against', 'during', 'until', 'since', 'than',
  // adverbs that mark English sentence structure
  'then', 'also', 'just', 'only', 'very', 'really', 'please', 'already', 'still', 'again',
  // hyper-common English verbs BM does not borrow
  'got', 'get', 'want', 'need', 'know', 'make', 'take', 'give', 'tell', 'ask',
]);

/** True when the message contains English sentence-structure words (i.e. it is not entirely BM). */
export function containsEnglish(message: string): boolean {
  const cleaned = message
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ') // URLs
    .replace(/\S+@\S+/g, ' ') // emails
    .replace(/\S*\w\.\w\S*/g, ' '); // bare domains/filenames like chubb.com.my
  const tokens = cleaned.match(/[a-z]+(?:'[a-z]+)*/g) ?? [];
  return tokens.some((t) => ENGLISH_MARKERS.has(t));
}

/** Final reply language: "ms" only when the LLM said "ms" AND the message is entirely BM. */
export function applyLanguagePolicy(message: string, detected: 'en' | 'ms'): 'en' | 'ms' {
  if (detected !== 'ms') return 'en';
  if (!message?.trim()) return 'en';
  return containsEnglish(message) ? 'en' : 'ms';
}
