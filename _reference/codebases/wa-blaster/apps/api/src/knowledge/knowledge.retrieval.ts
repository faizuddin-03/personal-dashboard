const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'is', 'are',
  'do', 'does', 'how', 'what', 'can', 'i', 'my', 'you', 'your', 'with', 'it',
  'this', 'that', 'me', 'we', 'be', 'as', 'at', 'by', 'online',
]);

export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export interface ScorableDoc {
  question: string;
  answer: string;
  category: string;
}

/**
 * Keyword-overlap relevance score. Question matches weigh most, then category,
 * then answer body. Deterministic; no external calls. Upgradeable to embeddings
 * later behind the same signature.
 * Each query token earns the score of its highest-priority matching field only
 * (question > category > answer), not the sum. Duplicate query tokens are de-duped.
 */
export function scoreDoc(query: string, doc: ScorableDoc): number {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return 0;

  const questionTokens = new Set(tokenize(doc.question));
  const categoryTokens = new Set(tokenize(doc.category));
  const answerTokens = new Set(tokenize(doc.answer));

  let score = 0;
  for (const t of queryTokens) {
    if (questionTokens.has(t)) score += 3;
    else if (categoryTokens.has(t)) score += 2;
    else if (answerTokens.has(t)) score += 1;
  }
  return score;
}
