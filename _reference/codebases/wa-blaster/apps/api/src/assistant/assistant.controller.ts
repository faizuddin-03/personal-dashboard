import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssistantService } from './assistant.service';
import { AssistantPlanService } from './assistant-plan.service';
import { ChatRequestDto } from './dto/chat.dto';

@Controller('assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly plans: AssistantPlanService,
  ) {}

  @Post('chat')
  chat(@Body() dto: ChatRequestDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.assistant.handleMessage({ message: dto.message, history: dto.history ?? [], userId });
  }

  @Post('plans/:id/approve')
  approve(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.plans.approve(id, userId);
  }

  @Post('plans/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.plans.cancel(id);
  }
}
