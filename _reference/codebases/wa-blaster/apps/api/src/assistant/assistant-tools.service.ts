import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SegmentsService } from '../segments/segments.service';
import { resolveDatetime } from './resolve-datetime';

@Injectable()
export class AssistantToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly segments: SegmentsService,
  ) {}

  /** Dispatch a read tool by name. Always resolves (errors are returned, not thrown). */
  async run(name: string, args: Record<string, unknown>): Promise<unknown> {
    try {
      switch (name) {
        case 'search_templates':
          return await this.searchTemplates(String(args.query ?? ''));
        case 'search_audience':
          return await this.searchAudience(String(args.query ?? ''));
        case 'resolve_datetime':
          return resolveDatetime(String(args.phrase ?? ''), new Date());
        case 'get_template_variables':
          return await this.getTemplateVariables(String(args.name ?? ''));
        default:
          return { error: `unknown tool ${name}` };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'tool failed' };
    }
  }

  private async searchTemplates(query: string) {
    const q = query.toLowerCase();
    const rows = await this.prisma.template.findMany({ where: { status: 'APPROVED' } });
    const byName = new Map<string, { name: string; languages: string[]; variables: string[] }>();
    for (const r of rows) {
      if (r.status !== 'APPROVED') continue;
      if (q && !r.name.toLowerCase().includes(q)) continue;
      const entry = byName.get(r.name) ?? { name: r.name, languages: [], variables: r.variables ?? [] };
      if (!entry.languages.includes(r.language)) entry.languages.push(r.language);
      byName.set(r.name, entry);
    }
    return { templates: [...byName.values()] };
  }

  private async searchAudience(query: string) {
    const q = query.toLowerCase();
    const all = await this.segments.list();
    const matches = q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all;
    const segments = [];
    for (const s of matches) {
      const { count } = await this.segments.preview(s.id);
      segments.push({ segmentId: s.id, name: s.name, count });
    }
    return { segments };
  }

  private async getTemplateVariables(name: string) {
    const rows = await this.prisma.template.findMany({ where: { name } });
    if (rows.length === 0) return { error: `template ${name} not found` };
    return { name, variables: rows[0].variables ?? [] };
  }
}
