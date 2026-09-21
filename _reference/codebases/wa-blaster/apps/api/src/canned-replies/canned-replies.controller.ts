import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CannedRepliesService } from './canned-replies.service';
import { CreateCannedReplyDto } from './dto/create-canned-reply.dto';
import { UpdateCannedReplyDto } from './dto/update-canned-reply.dto';

@Controller('canned-replies')
@UseGuards(JwtAuthGuard)
export class CannedRepliesController {
  constructor(private readonly cannedReplies: CannedRepliesService) {}

  @Get()
  list() {
    return this.cannedReplies.list();
  }

  @Post()
  create(@Body() dto: CreateCannedReplyDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.cannedReplies.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCannedReplyDto) {
    return this.cannedReplies.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.cannedReplies.remove(id);
  }
}
