import { BadRequestException } from '@nestjs/common';

/**
 * Choose the template rows a blast may send with.
 *
 * Normally only APPROVED rows are usable. When the send is scheduled in the
 * FUTURE we also allow a PENDING template (latest pending version) — the bet is
 * that Meta approves it before fire time; the blast worker re-checks approval at
 * send time (see BlastProcessor fire-time guard). APPROVED always wins over PENDING.
 */
export function selectUsableTemplateRows<T extends { version: number; language: string; status: string }>(
  rows: T[],
  defaultLanguage: string,
  isFuture: boolean,
): { latestVersion: number; usableRows: T[] } {
  if (rows.length === 0) throw new BadRequestException('Template not found');

  const approved = rows.filter((r) => r.status === 'APPROVED');
  let pool = approved;
  if (approved.length === 0) {
    if (!isFuture) {
      throw new BadRequestException('No APPROVED variant (immediate sends require approval)');
    }
    const pending = rows.filter((r) => r.status === 'PENDING');
    if (pending.length === 0) throw new BadRequestException('No APPROVED or PENDING variant');
    pool = pending;
  }

  const latestVersion = Math.max(...pool.map((r) => r.version));
  const usableRows = pool.filter((r) => r.version === latestVersion);
  if (!usableRows.find((r) => r.language === defaultLanguage)) {
    throw new BadRequestException(`Default language ${defaultLanguage} not available for this template`);
  }
  return { latestVersion, usableRows };
}
