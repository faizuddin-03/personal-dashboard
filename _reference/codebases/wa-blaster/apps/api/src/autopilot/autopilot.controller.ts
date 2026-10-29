import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AutopilotService } from './autopilot.service';
import { ListEventsDto } from './dto/list-events.dto';

@Controller('autopilot')
@UseGuards(JwtAuthGuard)
export class AutopilotController {
  constructor(private readonly autopilot: AutopilotService) {}

  @Get('events')
  events(@Query() q: ListEventsDto) {
    return this.autopilot.listEvents(q);
  }
}
