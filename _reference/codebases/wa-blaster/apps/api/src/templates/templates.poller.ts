import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TemplatesService } from './templates.service';

@Injectable()
export class TemplatesPoller {
  private readonly logger = new Logger(TemplatesPoller.name);

  constructor(private readonly templates: TemplatesService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async pollPending(): Promise<void> {
    const { checked, updated } = await this.templates.syncPending(true);
    if (checked > 0) this.logger.log(`Polled ${checked} stale PENDING template(s); ${updated} updated`);
  }
}
