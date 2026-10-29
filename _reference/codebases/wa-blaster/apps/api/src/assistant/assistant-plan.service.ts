import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';
import { BlastsService } from '../blasts/blasts.service';
import type { AssistantPlanInput, StagedPlan } from './assistant.types';

// Mirror CreateTemplateDto: lowercase, starts with a letter, min length 3.
const NAME_RE = /^[a-z][a-z0-9_]{2,}$/;
const LANGS = ['EN', 'MS', 'ZH', 'TA', 'OTHER'];

@Injectable()
export class AssistantPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: TemplatesService,
    private readonly blasts: BlastsService,
    private readonly config: ConfigService,
  ) {}

  private ttlMs(): number {
    const raw = Number(this.config.get<string>('ASSISTANT_PLAN_TTL_MS'));
    return Number.isFinite(raw) && raw > 0 ? raw : 30 * 60 * 1000;
  }

  /** Throw BadRequestException if the plan is malformed or references things that don't exist. */
  async validate(plan: AssistantPlanInput): Promise<void> {
    if (!plan || typeof plan !== 'object') throw new BadRequestException('plan missing');
    if (!plan.campaignName?.trim()) throw new BadRequestException('campaignName required');
    if (!LANGS.includes(plan.defaultLanguage)) throw new BadRequestException('invalid defaultLanguage');

    // schedule
    const sendAt = new Date(plan.schedule?.sendAt ?? '');
    if (Number.isNaN(sendAt.getTime())) throw new BadRequestException('invalid sendAt');
    if (sendAt.getTime() <= Date.now()) throw new BadRequestException('sendAt must be in the future');

    // variableMapping keys must be numeric strings
    for (const k of Object.keys(plan.variableMapping ?? {})) {
      if (!/^\d+$/.test(k)) throw new BadRequestException(`variableMapping key "${k}" must be a number`);
    }

    // audience — must be a real segment
    const segment = await this.prisma.contactSegment.findUnique({ where: { id: plan.audience?.segmentId ?? '' } });
    if (!segment) throw new BadRequestException('audience.segmentId does not match any segment');

    // template
    const t = plan.template;
    if (t?.mode === 'reuse') {
      const rows = await this.prisma.template.findMany({ where: { name: t.name } });
      if (rows.length === 0) throw new BadRequestException(`template "${t.name}" not found`);
      const approved = rows.filter((r) => r.status === 'APPROVED');
      if (approved.length === 0) throw new BadRequestException(`template "${t.name}" has no APPROVED variant`);
      if (!approved.find((r) => r.language === plan.defaultLanguage)) {
        throw new BadRequestException(`template "${t.name}" not APPROVED in ${plan.defaultLanguage}`);
      }
    } else if (t?.mode === 'create') {
      if (!NAME_RE.test(t.name)) throw new BadRequestException('template name must be lowercase letters/digits/underscores');
      if (!t.languages?.length) throw new BadRequestException('create template needs at least one language');
      if (!t.bodyText?.trim()) throw new BadRequestException('create template needs bodyText');
      if (!t.languages.includes(plan.defaultLanguage)) {
        throw new BadRequestException('defaultLanguage must be one of the created languages');
      }
    } else {
      throw new BadRequestException('template.mode must be "reuse" or "create"');
    }
  }

  async stage(plan: AssistantPlanInput, userId: string): Promise<StagedPlan> {
    await this.validate(plan);
    const row = await this.prisma.assistantPlan.create({
      data: {
        status: 'PENDING_APPROVAL',
        plan: plan as unknown as object,
        createdById: userId,
        expiresAt: new Date(Date.now() + this.ttlMs()),
      },
    });
    return this.toStaged(row);
  }

  /** Execute a staged plan deterministically: (create→submit template) then schedule the blast. */
  async approve(id: string, userId: string): Promise<{ blastId: string; templateName: string }> {
    const row = await this.prisma.assistantPlan.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('plan not found');
    if (row.status !== 'PENDING_APPROVAL') throw new BadRequestException('plan is not pending approval');
    if (row.expiresAt.getTime() < Date.now()) {
      await this.prisma.assistantPlan.update({ where: { id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('plan has expired — please ask again');
    }

    const plan = row.plan as unknown as AssistantPlanInput;
    await this.validate(plan); // re-validate at execution time (segment/time may have changed)

    let templateName = plan.template.name;
    let templateVersion: number | null = null;
    try {
      if (plan.template.mode === 'create') {
        const spec = plan.template; // const local: narrowed to CreateTemplateSpec, preserved inside the closure
        const created = await this.templates.createDraft(
          {
            name: spec.name,
            category: spec.category,
            variants: spec.languages.map((language) => ({
              language,
              bodyText: spec.bodyText,
              variables: spec.variables,
            })),
          },
          userId,
        );
        templateVersion = created[0]?.version ?? null;
        templateName = created[0]?.name ?? spec.name;
        if (templateVersion != null) await this.templates.submitGroup(templateName, templateVersion);
      }

      const blast = await this.blasts.createAndSchedule(
        {
          name: plan.campaignName,
          templateName,
          defaultLanguage: plan.defaultLanguage,
          segmentId: plan.audience.segmentId,
          variableMapping: plan.variableMapping,
          scheduledAt: plan.schedule.sendAt,
        },
        userId,
      );

      await this.prisma.assistantPlan.update({
        where: { id },
        data: { status: 'EXECUTED', blastId: blast.id, templateName, templateVersion },
      });
      return { blastId: blast.id, templateName };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'execution failed';
      await this.prisma.assistantPlan.update({ where: { id }, data: { error: message } }).catch(() => undefined);
      throw err;
    }
  }

  async get(id: string): Promise<StagedPlan> {
    const row = await this.prisma.assistantPlan.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('plan not found');
    return this.toStaged(row);
  }

  async cancel(id: string): Promise<StagedPlan> {
    const row = await this.prisma.assistantPlan.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('plan not found');
    // Never relabel an already-executed plan (would mislead the audit record while the blast still runs).
    if (row.status === 'EXECUTED') throw new BadRequestException('cannot cancel an already-executed plan');
    if (row.status === 'CANCELLED') return this.toStaged(row); // idempotent
    const updated = await this.prisma.assistantPlan.update({ where: { id }, data: { status: 'CANCELLED' } });
    return this.toStaged(updated);
  }

  private toStaged(row: { id: string; status: string; plan: unknown; expiresAt: Date }): StagedPlan {
    return {
      id: row.id,
      status: row.status as StagedPlan['status'],
      plan: row.plan as AssistantPlanInput,
      expiresAt: row.expiresAt.toISOString(),
    };
  }
}
