import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { ListKnowledgeDto } from './dto/list-knowledge.dto';

@Controller('knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  list(@Query() query: ListKnowledgeDto) {
    return this.knowledge.list(query);
  }

  @Get('candidates')
  candidates() {
    return this.knowledge.candidates();
  }

  @Post()
  create(@Body() dto: CreateKnowledgeDto) {
    return this.knowledge.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateKnowledgeDto) {
    return this.knowledge.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.knowledge.remove(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.knowledge.setStatus(id, 'PUBLISHED');
  }

  @Post(':id/dismiss')
  dismiss(@Param('id') id: string) {
    return this.knowledge.setStatus(id, 'DISMISSED');
  }

  @Post(':id/reindex')
  reindex(@Param('id') id: string) {
    return this.knowledge.reindex(id);
  }
}
