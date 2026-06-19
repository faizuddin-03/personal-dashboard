import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InboxService } from './inbox.service';
import { ListConversationsQuery } from './dto/list-conversations.query';
import { SendReplyDto } from './dto/send-reply.dto';

@Controller('inbox')
@UseGuards(JwtAuthGuard)
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get('conversations')
  list(@Query() q: ListConversationsQuery) {
    return this.inbox.listConversations({
      tab: q.tab,
      cursor: q.cursor,
      limit: q.limit ?? 50,
      search: q.search,
    });
  }

  @Get('conversations/:contactId')
  getOne(@Param('contactId') contactId: string) {
    return this.inbox.getConversation(contactId);
  }

  @Post('conversations/:contactId/messages')
  send(@Param('contactId') contactId: string, @Body() dto: SendReplyDto) {
    return this.inbox.sendReply(contactId, dto.body);
  }

  @Post('conversations/:contactId/resolve')
  resolve(@Param('contactId') contactId: string) {
    return this.inbox.markResolved(contactId);
  }

  @Post('conversations/:contactId/reopen')
  reopen(@Param('contactId') contactId: string) {
    return this.inbox.reopen(contactId);
  }

  @Get('unread-count')
  async unreadCount() {
    return { count: await this.inbox.unreadCount() };
  }
}
