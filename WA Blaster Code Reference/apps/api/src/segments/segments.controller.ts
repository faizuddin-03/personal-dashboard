import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';

@Controller('segments')
@UseGuards(JwtAuthGuard)
export class SegmentsController {
  constructor(private readonly segments: SegmentsService) {}

  @Get()
  list() {
    return this.segments.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.segments.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSegmentDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.segments.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSegmentDto) {
    return this.segments.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.segments.remove(id);
  }

  @Get(':id/preview')
  preview(@Param('id') id: string) {
    return this.segments.preview(id);
  }
}
