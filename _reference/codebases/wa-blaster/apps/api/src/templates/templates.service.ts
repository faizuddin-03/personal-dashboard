import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, TemplateStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappCloudApiService, MetaComponent } from '../whatsapp/whatsapp-cloud-api.service';
import { MetaTemplateStatusUpdateValue } from '../whatsapp/dto/meta-template-event.dto';
import { LlmService } from '../llm/llm.service';
import { TemplateDraft } from '../llm/llm.types';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { GenerateTemplateDto } from './dto/generate-template.dto';
import { ListTemplatesDto } from './dto/list-templates.dto';
import { TemplateLanguageVariantDto } from './dto/template-component.dto';
import { fromMetaLocale, fromMetaStatus, fromMetaCategory, parseMetaComponents } from './meta-template-mapping';

const ACTIVE_STATUSES: TemplateStatus[] = ['DRAFT', 'PENDING', 'APPROVED'];

// Map our local language code to Meta's locale code
function toMetaLocale(language: 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER'): string {
  const map: Record<string, string> = { EN: 'en', MS: 'ms', ZH: 'zh_CN', TA: 'ta', OTHER: 'en' };
  return map[language] ?? 'en';
}

/** Extract the {{N}} placeholders from a body string, in numeric order. */
function extractPlaceholderNumbers(body: string): string[] {
  const nums = new Set<string>();
  for (const m of body.matchAll(/\{\{(\d+)\}\}/g)) nums.add(m[1]);
  return Array.from(nums).sort((a, b) => Number(a) - Number(b));
}

function buildMetaComponents(variant: TemplateLanguageVariantDto, variableNames: string[]): MetaComponent[] {
  const components: MetaComponent[] = [];
  if (variant.header) {
    components.push({ type: 'HEADER', format: 'TEXT', text: variant.header.text });
  }
  // Meta requires `example.body_text` whenever the body has {{N}} placeholders.
  const placeholders = extractPlaceholderNumbers(variant.bodyText);
  const bodyComponent: MetaComponent = { type: 'BODY', text: variant.bodyText };
  if (placeholders.length > 0) {
    // A blank/whitespace name (operator left the field empty) falls back to a sample
    // so Meta always receives a non-empty example for every {{N}} placeholder.
    const examples = placeholders.map((_, i) => variableNames[i]?.trim() || `sample${i + 1}`);
    bodyComponent.example = { body_text: [examples] };
  }
  components.push(bodyComponent);
  if (variant.footerText) {
    components.push({ type: 'FOOTER', text: variant.footerText });
  }
  if (variant.buttons?.length) {
    components.push({
      type: 'BUTTONS',
      buttons: variant.buttons.map((b) => ({
        type: b.type,
        text: b.text,
        url: b.url,
        phone_number: b.phoneNumber,
      })),
    });
  }
  return components;
}

export interface SyncFromMetaResult {
  checked: number;
  imported: number;
  updated: number;
  categoryChanged: number;
  skipped: number;
}

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappCloudApiService,
    private readonly llm: LlmService,
  ) {}

  /** List the latest version of each named template, optionally filtered. */
  async list(q: ListTemplatesDto) {
    const where: Prisma.TemplateWhereInput = {};
    if (q.status?.length) where.status = { in: q.status };
    if (q.category?.length) where.category = { in: q.category };
    if (q.search) where.name = { contains: q.search, mode: 'insensitive' };

    return this.prisma.template.findMany({
      where,
      orderBy: [{ name: 'asc' }, { version: 'desc' }, { language: 'asc' }],
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.template.findUnique({ where: { id } });
    if (!t) throw new NotFoundException();
    return t;
  }

  /** All rows sharing a logical name (latest version), grouped for the editor view. */
  async findGroup(name: string) {
    const rows = await this.prisma.template.findMany({ where: { name }, orderBy: { version: 'desc' } });
    if (rows.length === 0) throw new NotFoundException();
    const maxVersion = rows[0].version;
    return rows.filter((r) => r.version === maxVersion);
  }

  async nextVersionFor(name: string): Promise<number> {
    const existing = await this.prisma.template.findMany({
      where: { name },
      select: { version: true, status: true },
    });
    if (existing.length === 0) return 1;

    const active = existing.find((r) => ACTIVE_STATUSES.includes(r.status));
    if (active) {
      throw new ConflictException(
        `Template "${name}" has an active version. Delete or wait for it to finish before creating a new one.`,
      );
    }
    return Math.max(...existing.map((r) => r.version)) + 1;
  }

  /** Create draft rows for all variants in one logical template. */
  async createDraft(dto: CreateTemplateDto, actorUserId: string) {
    const version = await this.nextVersionFor(dto.name);

    const created = await this.prisma.$transaction(
      dto.variants.map((variant) =>
        this.prisma.template.create({
          data: {
            name: dto.name,
            version,
            language: variant.language,
            category: dto.category,
            bodyText: variant.bodyText,
            headerJson: variant.header ? (variant.header as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
            footerText: variant.footerText,
            buttonsJson: variant.buttons?.length ? (variant.buttons as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
            variables: variant.variables,
            status: 'DRAFT',
            createdById: actorUserId,
          },
        }),
      ),
    );

    return created;
  }

  /** Replace the variants of a DRAFT group in place (same name + version). */
  async updateDraftGroup(name: string, dto: UpdateTemplateDto, actorUserId: string) {
    const rows = await this.findGroup(name);
    if (rows.some((r) => r.status !== 'DRAFT')) {
      throw new ConflictException('Only DRAFT templates can be edited.');
    }
    const version = rows[0].version;
    const byLanguage = new Map(rows.map((r) => [r.language as string, r]));
    const incoming = new Set(dto.variants.map((v) => v.language as string));

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    for (const variant of dto.variants) {
      const data = {
        category: dto.category,
        bodyText: variant.bodyText,
        headerJson: variant.header ? (variant.header as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        footerText: variant.footerText ?? null,
        buttonsJson: variant.buttons?.length ? (variant.buttons as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        variables: variant.variables,
      };
      const existing = byLanguage.get(variant.language);
      if (existing) {
        ops.push(this.prisma.template.update({ where: { id: existing.id }, data }));
      } else {
        ops.push(
          this.prisma.template.create({
            data: { name, version, language: variant.language, status: 'DRAFT', createdById: actorUserId, ...data },
          }),
        );
      }
    }
    for (const row of rows) {
      if (!incoming.has(row.language as string)) {
        ops.push(this.prisma.template.delete({ where: { id: row.id } }));
      }
    }
    await this.prisma.$transaction(ops);
    return this.findGroup(name);
  }

  /** Submit every DRAFT row in a logical template group to Meta. */
  async submitGroup(name: string, version: number) {
    const drafts = await this.prisma.template.findMany({ where: { name, version, status: 'DRAFT' } });
    if (drafts.length === 0) throw new NotFoundException('No DRAFT variants to submit');

    const results = [];
    for (const draft of drafts) {
      const variant: TemplateLanguageVariantDto = {
        language: draft.language as TemplateLanguageVariantDto['language'],
        bodyText: draft.bodyText,
        header: draft.headerJson as unknown as TemplateLanguageVariantDto['header'],
        footerText: draft.footerText ?? undefined,
        buttons: draft.buttonsJson as unknown as TemplateLanguageVariantDto['buttons'],
        variables: draft.variables ?? [],
      };

      const submission = await this.whatsapp.submitTemplate({
        name: draft.name,
        language: toMetaLocale(draft.language as 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER'),
        category: draft.category,
        components: buildMetaComponents(variant, draft.variables ?? []),
      });

      const updated = await this.prisma.template.update({
        where: { id: draft.id },
        data: {
          status: 'PENDING',
          metaTemplateId: submission.id,
          submittedAt: new Date(),
        },
      });
      results.push(updated);
    }
    return results;
  }

  async remove(id: string) {
    const existing = await this.prisma.template.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (existing.status === 'APPROVED' || existing.status === 'PENDING') {
      throw new ConflictException('Cannot delete a PENDING or APPROVED template — it must be disabled via Meta first.');
    }
    await this.prisma.template.delete({ where: { id } });
  }

  /**
   * Use the LLM to draft per-language WhatsApp templates from a brief.
   * Guardrail: if the provider judged the brief off-topic (relevant=false) or it
   * yielded no usable drafts, reject with a 400 so the UI can ask for a real brief
   * instead of silently surfacing nothing (or an off-topic answer).
   */
  async generateDrafts(dto: GenerateTemplateDto): Promise<TemplateDraft[]> {
    const result = await this.llm.generateTemplateDrafts({
      brief: dto.brief,
      languages: dto.languages,
      tone: dto.tone,
    });
    if (!result.relevant || result.drafts.length === 0) {
      throw new BadRequestException(
        result.refusalReason ||
          "That doesn't look like a WhatsApp template request. Describe the message you want to send to your dealers — e.g. \"insurance renewal reminder\".",
      );
    }
    return result.drafts;
  }

  /** Reconcile PENDING templates against Meta. staleOnly=true → only rows pending >1h (cron); false → all (manual sync). */
  async syncPending(staleOnly: boolean): Promise<{ checked: number; updated: number }> {
    const where: Prisma.TemplateWhereInput = { status: 'PENDING', metaTemplateId: { not: null } };
    if (staleOnly) where.submittedAt = { lt: new Date(Date.now() - 60 * 60 * 1000) };
    const pending = await this.prisma.template.findMany({ where });
    const map: Record<string, TemplateStatus> = { APPROVED: 'APPROVED', REJECTED: 'REJECTED', DISABLED: 'DISABLED' };
    let updated = 0;
    for (const row of pending) {
      try {
        const remote = await this.whatsapp.getTemplateStatus(row.metaTemplateId!);
        const newStatus = map[remote.status];
        if (!newStatus) continue;
        await this.prisma.template.update({
          where: { id: row.id },
          data: { status: newStatus, approvedAt: newStatus === 'APPROVED' ? new Date() : row.approvedAt },
        });
        updated++;
      } catch (err) {
        this.logger.warn(`Sync failed for ${row.id} (${row.metaTemplateId}): ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }
    return { checked: pending.length, updated };
  }

  /**
   * Pull EVERY template from the WABA into the app. Imports Meta-only templates
   * fully (usable in blasts) and overwrites status + category + content for rows
   * the app already has. Pristine never-submitted DRAFTs are left untouched.
   * Triggered by the manual Sync button; the hourly cron stays pending-only.
   */
  async syncFromMeta(actorUserId: string): Promise<SyncFromMetaResult> {
    const items = await this.whatsapp.listMessageTemplates();
    const locals = await this.prisma.template.findMany();

    type LocalRow = (typeof locals)[number];
    const byMetaId = new Map<string, LocalRow>();
    const submittedByNameLang = new Map<string, LocalRow>();
    const submittedVersionByName = new Map<string, number>();
    const maxVersionByName = new Map<string, number>();

    for (const row of locals) {
      if (row.metaTemplateId) byMetaId.set(row.metaTemplateId, row);
      maxVersionByName.set(row.name, Math.max(maxVersionByName.get(row.name) ?? 0, row.version));
      const submitted = row.metaTemplateId != null || row.status !== 'DRAFT';
      if (submitted) {
        submittedVersionByName.set(row.name, Math.max(submittedVersionByName.get(row.name) ?? 0, row.version));
        const key = `${row.name}::${row.language}`;
        const prev = submittedByNameLang.get(key);
        if (!prev || row.version > prev.version) submittedByNameLang.set(key, row);
      }
    }

    let imported = 0;
    let updated = 0;
    let categoryChanged = 0;
    let skipped = 0;
    const plannedInsertKeys = new Set<string>();
    const ops: Prisma.PrismaPromise<unknown>[] = [];

    for (const item of items) {
      const status = fromMetaStatus(item.status);
      if (!status) {
        skipped++;
        this.logger.warn(`Skipping ${item.name}/${item.language}: unknown Meta status "${item.status}"`);
        continue;
      }
      const language = fromMetaLocale(item.language);
      const category = fromMetaCategory(item.category);
      const content = parseMetaComponents(item.components);
      const headerJson = content.headerJson
        ? (content.headerJson as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull;
      const buttonsJson = content.buttonsJson
        ? (content.buttonsJson as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull;

      const match = byMetaId.get(item.id) ?? submittedByNameLang.get(`${item.name}::${language}`);

      if (match) {
        if (match.category !== category) categoryChanged++;
        ops.push(
          this.prisma.template.update({
            where: { id: match.id },
            data: {
              status,
              category,
              bodyText: content.bodyText,
              headerJson,
              footerText: content.footerText,
              buttonsJson,
              variables: content.variables,
              metaTemplateId: item.id,
              approvedAt: status === 'APPROVED' && match.status !== 'APPROVED' ? new Date() : match.approvedAt,
            },
          }),
        );
        updated++;
        continue;
      }

      // No match → insert. Join an existing submitted family for this name if one
      // exists; otherwise sit above any pristine drafts (max+1), else start at 1.
      const version =
        submittedVersionByName.get(item.name) ??
        (maxVersionByName.has(item.name) ? maxVersionByName.get(item.name)! + 1 : 1);
      const insertKey = `${item.name}::${version}::${language}`;
      if (plannedInsertKeys.has(insertKey)) {
        // Two Meta locales collapsed to the same local language this run — keep the first.
        skipped++;
        this.logger.warn(`Skipping duplicate ${item.name}/${language} (Meta locale ${item.language})`);
        continue;
      }
      plannedInsertKeys.add(insertKey);
      ops.push(
        this.prisma.template.create({
          data: {
            name: item.name,
            version,
            language,
            category,
            bodyText: content.bodyText,
            headerJson,
            footerText: content.footerText,
            buttonsJson,
            variables: content.variables,
            status,
            metaTemplateId: item.id,
            submittedAt: status === 'DRAFT' ? null : new Date(),
            approvedAt: status === 'APPROVED' ? new Date() : null,
            createdById: actorUserId,
          },
        }),
      );
      imported++;
    }

    await this.prisma.$transaction(ops);
    return { checked: items.length, imported, updated, categoryChanged, skipped };
  }

  /** Webhook handler entry point — preserved from the Task 5 stub. */
  async applyMetaTemplateUpdate(event: MetaTemplateStatusUpdateValue): Promise<void> {
    const metaId = String(event.message_template_id);
    const row = await this.prisma.template.findFirst({ where: { metaTemplateId: metaId } });
    if (!row) {
      this.logger.warn(`Webhook for unknown meta_template_id=${metaId} (name=${event.message_template_name})`);
      return;
    }
    const map: Record<string, TemplateStatus> = {
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      DISABLED: 'DISABLED',
      FLAGGED: 'DISABLED',
    };
    const newStatus = map[event.event];
    if (!newStatus) {
      this.logger.log(`Ignoring template event=${event.event} for ${metaId}`);
      return;
    }
    await this.prisma.template.update({
      where: { id: row.id },
      data: {
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? (event.reason ?? null) : null,
        approvedAt: newStatus === 'APPROVED' ? new Date() : row.approvedAt,
      },
    });
  }
}
