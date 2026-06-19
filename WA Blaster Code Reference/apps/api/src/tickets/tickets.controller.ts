import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketsService } from './tickets.service';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { CreateKnowledgeCandidateDto } from './dto/create-knowledge-candidate.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  list(@Query() query: ListTicketsDto) {
    return this.tickets.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tickets.get(id);
  }

  @Get(':id/agent-context')
  agentContext(@Param('id') id: string) {
    return this.tickets.agentContext(id);
  }

  @Post(':id/suggest-reply')
  suggestReply(@Param('id') id: string) {
    return this.tickets.suggestReply(id);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto, @Req() req: Request) {
    const assigneeId = dto.assigneeId ?? (req.user as { id: string }).id;
    return this.tickets.assign(id, assigneeId);
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.tickets.resolve(id);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.tickets.close(id);
  }

  @Post(':id/reopen')
  reopen(@Param('id') id: string) {
    return this.tickets.reopen(id);
  }

  @Get(':id/knowledge-suggestion')
  knowledgeSuggestion(@Param('id') id: string) {
    return this.tickets.suggestKnowledge(id);
  }

  @Post(':id/knowledge-candidate')
  createKnowledgeCandidate(@Param('id') id: string, @Body() dto: CreateKnowledgeCandidateDto) {
    return this.tickets.createKnowledgeCandidate(id, dto);
  }
}
