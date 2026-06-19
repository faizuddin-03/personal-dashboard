import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DecisionStatsQueryDto, ListDecisionsDto } from '../dto/decisions.dto';
import { DecisionQueryService } from './decision-query.service';

@ApiTags('chatbot/decisions')
@ApiBearerAuth()
@Controller('chatbot/decisions')
@UseGuards(JwtAuthGuard)
export class DecisionsController {
  constructor(private readonly decisions: DecisionQueryService) {}

  // `stats` is a literal sub-path, declared first so it can never be shadowed by a future param route.
  @Get('stats')
  @ApiOperation({ summary: 'Aggregate decision stats over a rolling window (rates, latencies, daily series).' })
  stats(@Query() q: DecisionStatsQueryDto) {
    return this.decisions.stats(q.days ?? 7);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated, filterable audit list of chatbot decisions (newest first).' })
  list(@Query() q: ListDecisionsDto) {
    return this.decisions.list(q);
  }
}
