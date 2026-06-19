import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  CloseConversationDto,
  ListConversationsDto,
  ManualReplyDto,
  UpdateConversationDto,
} from '../dto/conversations.dto';
import { InboxService } from './inbox.service';

@ApiTags('chatbot/conversations')
@ApiBearerAuth()
@Controller('chatbot/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly inbox: InboxService) {}

  @Get()
  @ApiOperation({ summary: 'List inbox conversations with filtering, search and pagination.' })
  list(@Query() q: ListConversationsDto) {
    return this.inbox.listConversations(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single conversation with its contact, messages and bot drafts.' })
  get(@Param('id') id: string) {
    return this.inbox.getConversation(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Triage a conversation: pin/unpin, set tags, assign/unassign an operator.' })
  update(@Param('id') id: string, @Body() dto: UpdateConversationDto) {
    return this.inbox.updateConversation(id, dto);
  }

  @Post(':id/manual-reply')
  @ApiOperation({ summary: 'Send a free-form operator reply to the customer via WhatsApp.' })
  manualReply(@Param('id') id: string, @Body() dto: ManualReplyDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.inbox.manualReply(id, dto.body, userId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a conversation with a disposition, triggering resolution capture.' })
  close(@Param('id') id: string, @Body() dto: CloseConversationDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.inbox.closeConversation(id, userId, dto);
  }
}
