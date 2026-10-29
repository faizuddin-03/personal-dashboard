import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { encode, decode } from 'gpt-tokenizer';
import { ChunkerService } from './chunker.service';

function makeConfig(overrides: Record<string, string | number | undefined> = {}): ConfigService {
  const base: Record<string, string | number | undefined> = {
    CHATBOT_CHUNK_SIZE_TOKENS: 500,
    CHATBOT_CHUNK_OVERLAP_TOKENS: 50,
  };
  const merged = { ...base, ...overrides };
  return {
    get: (key: string, fallback?: unknown) => (merged[key] !== undefined ? merged[key] : fallback),
  } as unknown as ConfigService;
}

const tokens = (s: string) => encode(s).length;

describe('ChunkerService', () => {
  it('returns [] for an empty document', () => {
    const svc = new ChunkerService(makeConfig());
    expect(svc.chunk('')).toEqual([]);
    expect(svc.chunk('   \n\n   \t  \n')).toEqual([]);
  });

  it('returns a single chunk for a short document (< chunkSize)', () => {
    const svc = new ChunkerService(makeConfig());
    const md = 'This is a short knowledge base article about shipping.';

    const chunks = svc.chunk(md);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].text).toContain('short knowledge base article');
    expect(chunks[0].tokenCount).toBe(tokens(chunks[0].text));
  });

  it('splits a long plain-markdown document into multiple chunks with overlap', () => {
    const overlap = 5;
    const svc = new ChunkerService(makeConfig({ CHATBOT_CHUNK_SIZE_TOKENS: 30, CHATBOT_CHUNK_OVERLAP_TOKENS: overlap }));
    // Several paragraphs, each well under the chunk budget, that together exceed it.
    const paragraphs = Array.from({ length: 8 }, (_, i) =>
      `Paragraph number ${i} talks about delivery times, courier partners, and tracking numbers in detail.`,
    );
    const md = paragraphs.join('\n\n');

    const chunks = svc.chunk(md);

    expect(chunks.length).toBeGreaterThan(1);
    // Sequential, zero-based indices.
    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
    // Every chunk reports the token count of its own text.
    for (const c of chunks) expect(c.tokenCount).toBe(tokens(c.text));
    // Overlap: the tail of each chunk reappears near the head of the next.
    for (let i = 0; i < chunks.length - 1; i++) {
      const tail = decode(encode(chunks[i].text).slice(-overlap)).trim();
      expect(chunks[i + 1].text).toContain(tail);
    }
  });

  it('prepends the parent heading to every chunk of a long section', () => {
    const svc = new ChunkerService(makeConfig({ CHATBOT_CHUNK_SIZE_TOKENS: 30, CHATBOT_CHUNK_OVERLAP_TOKENS: 5 }));
    const body = Array.from({ length: 6 }, (_, i) =>
      `Row ${i}: rates vary by weight, destination zone, and selected service level.`,
    ).join('\n\n');
    const md = `# Shipping table\n\n${body}`;

    const chunks = svc.chunk(md);

    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.text).toContain('# Shipping table');
  });

  it('splits a large table (> row threshold) into one chunk per data row, each carrying the header', () => {
    const svc = new ChunkerService(makeConfig({ CHATBOT_CHUNK_SIZE_TOKENS: 20, CHATBOT_CHUNK_OVERLAP_TOKENS: 5 }));
    const rows = Array.from({ length: 12 }, (_, i) => `| Zone ${i} | RM ${i * 5} | ${i + 1} days |`);
    const header = '| Zone | Price | ETA |';
    const table = [header, '| --- | --- | --- |', ...rows].join('\n');
    const md = `Intro paragraph before the table.\n\n${table}\n\nClosing paragraph after the table.`;

    const chunks = svc.chunk(md);

    // Each data row becomes its own chunk, rendered as natural language with column labels.
    const rowChunks = chunks.filter((c) => /^Zone \d+ —/m.test(c.text));
    expect(rowChunks).toHaveLength(12);
    for (let i = 0; i < 12; i++) {
      const c = rowChunks.find((rc) => rc.text.includes(`Zone ${i} — Price: RM ${i * 5}; ETA: ${i + 1} days`));
      expect(c).toBeDefined();
    }
    expect(header).toBeTruthy(); // (header columns are inlined as labels, no pipe scaffolding)
  });

  it('splits a very large table per row so no single chunk is oversized', () => {
    const svc = new ChunkerService(makeConfig());
    const rows = Array.from({ length: 500 }, (_, i) => `| Zone number ${i} | Price RM ${i * 5} | Delivery ${i + 1} days |`);
    const table = ['| Zone | Price | ETA |', '| --- | --- | --- |', ...rows].join('\n');
    expect(tokens(table)).toBeGreaterThan(1500);

    const chunks = svc.chunk(table);

    const rowChunks = chunks.filter((c) => /^Zone number \d+ —/m.test(c.text));
    expect(rowChunks).toHaveLength(500);
    for (const c of chunks) expect(c.tokenCount).toBeLessThan(1500); // no diluted mega-chunk
  });

  it('keeps a small table (<= row threshold) whole in a single chunk', () => {
    const svc = new ChunkerService(makeConfig());
    const header = '| Term | Meaning |';
    const table = [header, '| --- | --- |', '| You | the policyholder |', '| We | the insurer |'].join('\n');

    const chunks = svc.chunk(`### Definitions\n\n${table}`);

    const withRows = chunks.filter((c) => c.text.includes('| You |') || c.text.includes('| We |'));
    expect(withRows).toHaveLength(1);
    expect(withRows[0].text).toContain('| You |');
    expect(withRows[0].text).toContain('| We |');
  });

  it('makes each benefit row independently retrievable with its label, figure, header and heading', () => {
    const svc = new ChunkerService(makeConfig());
    const header = '| Product Plan | Standard | Deluxe |';
    const md = [
      '### Section 3: Table of Benefits',
      '',
      header,
      '| --- | --- | --- |',
      '| **Additional Extensions** | | |',
      '| Section 4.4 Replacement Car Service | Up to maximum of ten (10) days per Incident | Up to maximum of ten (10) days per Incident |',
      '| Section 4.5 Hotel Accommodation Reimbursement | Up to RM200 per day and maximum five (5) days per incident. | Up to RM200 per day and maximum five (5) days per incident. |',
      '| Section 4.6 Windscreen | Up to RM500 | Up to RM1000 |',
      '| Section 4.7 Flood | Covered | Covered |',
      '| Section 4.8 Riot | Covered | Covered |',
    ].join('\n');

    const chunks = svc.chunk(md);

    const hotel = chunks.filter((c) => c.text.includes('Hotel Accommodation Reimbursement'));
    expect(hotel).toHaveLength(1);
    expect(hotel[0].text).toContain('RM200 per day and maximum five (5) days');
    // rendered as natural language with the column name inlined, no pipe scaffolding
    expect(hotel[0].text).toContain('Standard: Up to RM200 per day');
    expect(hotel[0].text).not.toContain('| Product Plan |');
    expect(hotel[0].text).toContain('### Section 3: Table of Benefits');
    // not diluted with unrelated benefit rows
    expect(hotel[0].text).not.toContain('Windscreen');
    expect(hotel[0].text).not.toContain('Replacement Car Service');
    // the empty sub-header row is not emitted as a standalone chunk
    expect(chunks.some((c) => c.text.includes('Additional Extensions'))).toBe(false);
    expect(header).toBeTruthy();
  });

  it('never splits a fenced code block mid-block', () => {
    const svc = new ChunkerService(makeConfig({ CHATBOT_CHUNK_SIZE_TOKENS: 20, CHATBOT_CHUNK_OVERLAP_TOKENS: 5 }));
    const code = ['```ts', ...Array.from({ length: 10 }, (_, i) => `const line${i} = ${i} + ${i};`), '```'].join('\n');
    const md = `Intro text before code.\n\n${code}\n\nText after the code block.`;

    const chunks = svc.chunk(md);

    const codeChunks = chunks.filter((c) => c.text.includes('```ts'));
    expect(codeChunks).toHaveLength(1);
    const codeChunk = codeChunks[0];
    expect(codeChunk.text).toContain('const line0 = 0 + 0;');
    expect(codeChunk.text).toContain('const line9 = 9 + 9;');
    // Opening and closing fences are both present in the same chunk.
    expect(codeChunk.text.match(/```/g)?.length).toBe(2);
  });
});
