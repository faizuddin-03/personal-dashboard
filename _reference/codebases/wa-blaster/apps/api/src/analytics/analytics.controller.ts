import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { SendTimeAdvisorService } from './send-time-advisor.service';
import { RangeDto } from './dto/range.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly sendTime: SendTimeAdvisorService,
  ) {}

  @Get('audience')
  audience() {
    return this.analytics.audience();
  }

  @Get('delivery')
  delivery(@Query() q: RangeDto) {
    return this.analytics.delivery(q.range);
  }

  @Get('volume')
  volume(@Query() q: RangeDto) {
    return this.analytics.volume(q.range);
  }

  @Get('autopilot')
  autopilot(@Query() q: RangeDto) {
    return this.analytics.autopilot(q.range);
  }

  @Get('escalation')
  escalation(@Query() q: RangeDto) {
    return this.analytics.escalation(q.range);
  }

  @Get('kpis')
  kpis(@Query() q: RangeDto) {
    return this.analytics.kpis(q.range);
  }

  @Get('send-time-advice/:blastId')
  sendTimeAdvice(@Param('blastId') blastId: string) {
    return this.sendTime.getAdvice(blastId);
  }
}
