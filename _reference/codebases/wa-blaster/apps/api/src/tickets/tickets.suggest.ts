/** Propose a KB doc filename from a question, e.g. "How do I transfer a vehicle?" -> "how_do_transfer_vehicle.md". */
export function suggestSlug(question: string): string {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 2)
    .slice(0, 4);
  return (words.length ? words.join('_') : 'answer') + '.md';
}
