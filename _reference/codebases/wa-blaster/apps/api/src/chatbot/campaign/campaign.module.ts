import { Module } from '@nestjs/common';
import { CampaignContextService } from './campaign-context.service';

/** PrismaModule is @Global, so PrismaService needs no explicit import here. */
@Module({
  providers: [CampaignContextService],
  exports: [CampaignContextService],
})
export class CampaignModule {}
