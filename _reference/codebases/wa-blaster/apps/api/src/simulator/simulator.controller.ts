import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SimulatorGuard } from './simulator.guard';
import { SimulatorService } from './simulator.service';
import { SimulateInboundDto } from './dto/simulate-inbound.dto';

@ApiTags('simulator')
@ApiBearerAuth()
@Controller('sim')
@UseGuards(JwtAuthGuard, RolesGuard, SimulatorGuard)
@Roles('ADMIN')
export class SimulatorController {
  constructor(private readonly sim: SimulatorService) {}

  @Post('inbound')
  @ApiOperation({ summary: 'Inject an inbound message and run the chatbot synchronously.' })
  inbound(@Body() dto: SimulateInboundDto) {
    return this.sim.simulateInbound(dto.phone, dto.text);
  }

  @Get('thread/:phone')
  @ApiOperation({ summary: 'Unified phone timeline (chat + blasts), chronological.' })
  thread(@Param('phone') phone: string) {
    return this.sim.getThread(phone);
  }

  @Post('reset/:phone')
  @ApiOperation({ summary: 'Delete the simulated conversation for this number.' })
  reset(@Param('phone') phone: string) {
    return this.sim.reset(phone);
  }

  @Get('status')
  @ApiOperation({ summary: 'Report simulator + mock-mode flags.' })
  status() {
    return this.sim.status();
  }
}
