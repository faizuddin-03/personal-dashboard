import { BadRequestException, Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SystemSettingsService } from './system-settings.service';

const VALID_TIERS = new Set(['TIER_1', 'TIER_2', 'TIER_3', 'UNLIMITED']);
const VALID_AFTER_HOURS = new Set(['AWAY_THEN_ESCALATE', 'ESCALATE_ONLY']);

interface UpdateBody {
  currentMessagingTier?: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNLIMITED';
  replyAttributionWindowDays?: number;
  autopilotEnabled?: boolean;
  autopilotEscalationThreshold?: number;
  autopilotHonourStop?: boolean;
  autopilotAfterHours?: 'AWAY_THEN_ESCALATE' | 'ESCALATE_ONLY';
}

@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SystemSettingsController {
  constructor(private readonly settings: SystemSettingsService) {}

  @Get()
  async list() {
    const tier = await this.settings.get('current_messaging_tier', 'TIER_1');
    const window = await this.settings.get('reply_attribution_window_days', '7');
    return {
      currentMessagingTier: tier,
      replyAttributionWindowDays: Number(window),
      autopilot: {
        enabled: (await this.settings.get('autopilot_enabled', 'true')) === 'true',
        escalationThreshold: Number(await this.settings.get('autopilot_escalation_threshold', '70')),
        honourStop: (await this.settings.get('autopilot_honour_stop', 'true')) === 'true',
        afterHours: await this.settings.get('autopilot_after_hours', 'AWAY_THEN_ESCALATE'),
      },
    };
  }

  @Patch()
  async update(@Body() body: UpdateBody) {
    if (body.currentMessagingTier !== undefined) {
      if (!VALID_TIERS.has(body.currentMessagingTier)) {
        throw new BadRequestException(`invalid tier: ${body.currentMessagingTier}`);
      }
      await this.settings.set('current_messaging_tier', body.currentMessagingTier);
    }
    if (body.replyAttributionWindowDays !== undefined) {
      const n = body.replyAttributionWindowDays;
      if (!Number.isInteger(n) || n < 1 || n > 30) {
        throw new BadRequestException(`window must be an integer between 1 and 30, got ${n}`);
      }
      await this.settings.set('reply_attribution_window_days', String(n));
    }
    if (body.autopilotEnabled !== undefined) {
      await this.settings.set('autopilot_enabled', String(body.autopilotEnabled));
    }
    if (body.autopilotEscalationThreshold !== undefined) {
      const n = body.autopilotEscalationThreshold;
      if (!Number.isInteger(n) || n < 40 || n > 95) {
        throw new BadRequestException(
          `autopilotEscalationThreshold must be an integer between 40 and 95, got ${n}`,
        );
      }
      await this.settings.set('autopilot_escalation_threshold', String(n));
    }
    if (body.autopilotHonourStop !== undefined) {
      await this.settings.set('autopilot_honour_stop', String(body.autopilotHonourStop));
    }
    if (body.autopilotAfterHours !== undefined) {
      if (!VALID_AFTER_HOURS.has(body.autopilotAfterHours)) {
        throw new BadRequestException(
          `autopilotAfterHours must be AWAY_THEN_ESCALATE or ESCALATE_ONLY, got ${body.autopilotAfterHours}`,
        );
      }
      await this.settings.set('autopilot_after_hours', body.autopilotAfterHours);
    }
    return this.list();
  }
}
