import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decode, encode } from 'gpt-tokenizer';

export interface Chunk {
  text: string;
  tokenCount: number;
  index: number;
  /**
   * Set when this chunk needs special handling at ingestion. `table_row` is a single split-out table
   * row (enrichment is appended in place — the row is short). `prose_enrichment` is a standalone
   * enrichment chunk emitted by ingestion for a consequence-prose chunk (kept separate so its short,
   * query-dense restatement embeds without being diluted by the long source prose).
   */
  kind?: 'table_row' | 'prose_enrichment';
}

type BlockType = 'heading' | 'table' | 'code' | 'paragraph';

interface Block {
  type: BlockType;
  text: string;
}

/** Tables larger than this are kept whole but flagged — they bloat a single chunk. */
const TABLE_WARN_TOKENS = 1500;

/**
 * Splits markdown into embedding-sized chunks. Atomic blocks (tables, code fences,
 * paragraphs, headings) are never broken mid-way; blocks are packed greedily up to
 * the token budget, consecutive chunks overlap by a few tokens for context, and each
 * chunk is prefixed with its parent heading.
 */
@Injectable()
export class ChunkerService {
  private readonly logger = new Logger(ChunkerService.name);
  private readonly chunkSize: number;
  private readonly overlap: number;
  private readonly tableRowSplitMinRows: number;

  constructor(config: ConfigService) {
    this.chunkSize = Number(config.get('CHATBOT_CHUNK_SIZE_TOKENS', 500));
    this.overlap = Number(config.get('CHATBOT_CHUNK_OVERLAP_TOKENS', 50));
    // Tables with MORE than this many value-bearing rows are split into one chunk per row, so a
    // single benefit's figure isn't diluted across a whole "Table of Benefits". Smaller tables
    // stay whole.
    this.tableRowSplitMinRows = Number(config.get('CHATBOT_TABLE_ROW_SPLIT_MIN_ROWS', 4));
  }

  chunk(markdown: string): Chunk[] {
    const blocks = this.toBlocks(markdown);
    if (blocks.length === 0) return [];

    const chunks: Chunk[] = [];
    let activeHeading = '';
    let pending: string[] = []; // content blocks accumulated for the current chunk
    let pendingTokens = 0;
    let prevText = ''; // last emitted chunk's text, for overlap

    const flush = () => {
      if (pending.length === 0) return;
      const parts: string[] = [];
      if (activeHeading) parts.push(activeHeading);
      if (chunks.length > 0 && this.overlap > 0 && prevText) {
        const tail = decode(encode(prevText).slice(-this.overlap)).trim();
        if (tail) parts.push(tail);
      }
      parts.push(...pending);
      const text = parts.join('\n\n');
      chunks.push({ text, tokenCount: encode(text).length, index: chunks.length });
      prevText = text;
      pending = [];
      pendingTokens = 0;
    };

    for (const block of blocks) {
      if (block.type === 'heading') {
        // A heading is a semantic boundary and the context prefix for what follows.
        flush();
        activeHeading = block.text;
        continue;
      }

      // Large multi-row tables: emit each data row as its own focused chunk, rendered as natural
      // language (label + "Column: value" pairs, no pipe scaffolding) under the parent heading, so
      // a single benefit's figure is independently retrievable and embeds on its content rather
      // than being diluted by table markup or buried in a whole-table chunk.
      if (block.type === 'table') {
        const rows = this.splitTableRows(block.text);
        if (rows) {
          flush();
          for (const row of rows) {
            const parts: string[] = [];
            if (activeHeading) parts.push(activeHeading);
            parts.push(row);
            const text = parts.join('\n\n');
            chunks.push({ text, tokenCount: encode(text).length, index: chunks.length, kind: 'table_row' });
          }
          prevText = ''; // don't bleed a row's overlap into the next block
          continue;
        }
      }

      const blockTokens = encode(block.text).length;
      if (block.type === 'table' && blockTokens > TABLE_WARN_TOKENS) {
        this.logger.warn(`Knowledge table exceeds 1500 tokens (${blockTokens}); kept whole in a single chunk.`);
      }

      // Adding this block would overflow the budget — start a fresh chunk first.
      if (pending.length > 0 && pendingTokens + blockTokens > this.chunkSize) {
        flush();
      }
      pending.push(block.text);
      pendingTokens += blockTokens;
    }
    flush();

    return chunks;
  }

  /**
   * Decide whether a markdown table should be row-split, returning each value-bearing row rendered
   * as a natural-language line ("<label> — <Column>: <value>; …") when the table has more than
   * `tableRowSplitMinRows` such rows; otherwise null (keep the table whole). Rendering as prose
   * rather than `| pipes |` lets each row embed on its actual content. Pure-label sub-header rows
   * (e.g. `| **Additional Extensions** | | |`) carry no figure and are dropped.
   */
  private splitTableRows(tableText: string): string[] | null {
    const lines = tableText.split('\n').filter((l) => l.trim().startsWith('|'));
    if (lines.length < 2) return null;

    const headers = this.cells(lines[0]);
    const hasSeparator = /^\s*\|[\s:|-]+\|\s*$/.test(lines[1]);
    const dataLines = lines.slice(hasSeparator ? 2 : 1);

    const rendered: string[] = [];
    for (const line of dataLines) {
      const cells = this.cells(line);
      if (!cells.slice(1).some((c) => c.length > 0)) continue; // skip sub-header / empty-value rows
      const label = cells[0] ?? '';
      const valueParts: string[] = [];
      for (let i = 1; i < cells.length; i++) {
        if (!cells[i]) continue;
        const col = headers[i] ?? '';
        valueParts.push(col ? `${col}: ${cells[i]}` : cells[i]);
      }
      rendered.push(label ? `${label} — ${valueParts.join('; ')}` : valueParts.join('; '));
    }

    if (rendered.length <= this.tableRowSplitMinRows) return null;
    return rendered;
  }

  /** Split a `| a | b | c |` row into its trimmed inner cells. */
  private cells(rowLine: string): string[] {
    return rowLine.split('|').slice(1, -1).map((c) => c.trim());
  }

  /** Parse markdown into atomic blocks: code fences, tables, headings, paragraphs. */
  private toBlocks(markdown: string): Block[] {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.trim() === '') {
        i++;
        continue;
      }

      // Fenced code block — collect through the closing fence.
      if (line.trimStart().startsWith('```')) {
        const buf = [line];
        i++;
        while (i < lines.length) {
          buf.push(lines[i]);
          if (lines[i].trimStart().startsWith('```')) {
            i++;
            break;
          }
          i++;
        }
        blocks.push({ type: 'code', text: buf.join('\n') });
        continue;
      }

      // Table — consecutive lines beginning with `|`.
      if (line.trimStart().startsWith('|')) {
        const buf: string[] = [];
        while (i < lines.length && lines[i].trimStart().startsWith('|')) {
          buf.push(lines[i]);
          i++;
        }
        blocks.push({ type: 'table', text: buf.join('\n') });
        continue;
      }

      // Heading — a single line starting with one or more `#`.
      if (/^#{1,6}\s/.test(line.trimStart())) {
        blocks.push({ type: 'heading', text: line.trim() });
        i++;
        continue;
      }

      // Paragraph — until a blank line or a structural line.
      const buf: string[] = [];
      while (i < lines.length) {
        const l = lines[i];
        if (
          l.trim() === '' ||
          l.trimStart().startsWith('```') ||
          l.trimStart().startsWith('|') ||
          /^#{1,6}\s/.test(l.trimStart())
        ) {
          break;
        }
        buf.push(l);
        i++;
      }
      blocks.push({ type: 'paragraph', text: buf.join('\n') });
    }

    return blocks;
  }
}
