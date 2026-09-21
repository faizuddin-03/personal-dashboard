import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { SendTimeAdvisorService } from './send-time-advisor.service';
import { AnalyticsController } from './analytics.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // JwtAuthGuard; PrismaService, ConfigService, and LlmService are @Global
  controllers: [AnalyticsController],
  providers: [AnalyticsService, SendTimeAdvisorService],
})
export class AnalyticsModule {}
