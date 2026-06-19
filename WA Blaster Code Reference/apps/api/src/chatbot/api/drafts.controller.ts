import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EditDraftDto, ListDraftsDto, RejectDraftDto } from '../dto/drafts.dto';
import { DraftsService } from './drafts.service';

/**
 * Operator console for the bot's escalation drafts: list pending drafts, then approve (send as-is),
 * edit (send a revised body) or reject (discard and reply manually). Every route is operator-only.
 */
@ApiTags('chatbot/drafts')
@ApiBearerAuth()
@Controller('chatbot/drafts')
@UseGuards(JwtAuthGuard)
export class DraftsController {
  constructor(private readonly drafts: DraftsService) {}

  @Get()
  @ApiOperation({ summary: 'List bot escalation drafts (defaults to PENDING), newest first.' })
  list(@Query() query: ListDraftsDto) {
    return this.drafts.list(query);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a pending draft: send it to the customer as-is and record the reply.' })
  approve(@Param('id') id: string, @Req() req: Request) {
    return this.drafts.approve(id, (req.user as { id: string }).id);
  }

  @Post(':id/edit')
  @ApiOperation({ summary: 'Edit a pending draft: send the revised body to the customer and record it.' })
  edit(@Param('id') id: string, @Body() dto: EditDraftDto, @Req() req: Request) {
    return this.drafts.edit(id, (req.user as { id: string }).id, dto.body);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a pending draft: discard it so the operator replies manually.' })
  reject(@Param('id') id: string, @Body() dto: RejectDraftDto, @Req() req: Request) {
    return this.drafts.reject(id, (req.user as { id: string }).id, dto.reason);
  }
}
