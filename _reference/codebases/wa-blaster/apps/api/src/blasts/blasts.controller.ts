import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BlastsService } from './blasts.service';
import { CreateBlastDto } from './dto/create-blast.dto';
import { ListBlastsDto } from './dto/list-blasts.dto';
import { PreviewStateLanguagesDto } from './dto/preview-state-languages.dto';
import { ListBlastMessagesDto } from './dto/list-blast-messages.dto';

@Controller('blasts')
@UseGuards(JwtAuthGuard)
export class BlastsController {
  constructor(private readonly blasts: BlastsService) {}

  @Get()
  list(@Query() q: ListBlastsDto) {
    return this.blasts.list(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blasts.findOne(id);
  }

  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.blasts.stats(id);
  }

  @Get(':id/messages')
  messages(@Param('id') id: string, @Query() q: ListBlastMessagesDto) {
    return this.blasts.listMessages(id, q);
  }

  @Post('preview-state-languages')
  previewStateLanguages(@Body() dto: PreviewStateLanguagesDto) {
    return this.blasts.previewStateLanguages(dto);
  }

  @Post()
  create(@Body() dto: CreateBlastDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.blasts.createAndSchedule(dto, userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.blasts.cancel(id);
  }

  @Post(':id/messages/:messageId/retry')
  retryMessage(@Param('id') id: string, @Param('messageId') messageId: string) {
    return this.blasts.retryMessage(id, messageId);
  }

  @Post(':id/retry-failed')
  retryFailed(@Param('id') id: string) {
    return this.blasts.retryFailed(id);
  }
}
