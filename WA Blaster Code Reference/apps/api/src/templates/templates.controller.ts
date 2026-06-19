import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { GenerateTemplateDto } from './dto/generate-template.dto';
import { ListTemplatesDto } from './dto/list-templates.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@Query() q: ListTemplatesDto) {
    return this.templates.list(q);
  }

  @Get('group/:name')
  findGroup(@Param('name') name: string) {
    return this.templates.findGroup(name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templates.findOne(id);
  }

  @Post('generate')
  generate(@Body() dto: GenerateTemplateDto) {
    return this.templates.generateDrafts(dto);
  }

  @Post('sync')
  sync() {
    return this.templates.syncPending(false);
  }

  @Post()
  create(@Body() dto: CreateTemplateDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.templates.createDraft(dto, userId);
  }

  @Patch('group/:name')
  updateGroup(@Param('name') name: string, @Body() dto: UpdateTemplateDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.templates.updateDraftGroup(name, dto, userId);
  }

  @Post(':name/:version/submit')
  @HttpCode(202)
  submit(@Param('name') name: string, @Param('version') versionParam: string) {
    return this.templates.submitGroup(name, Number(versionParam));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.templates.remove(id);
  }
}
