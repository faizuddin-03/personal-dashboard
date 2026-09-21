import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { DiscardCaptureDto, ListCapturesDto, PreviewCaptureDto, PromoteCaptureDto } from '../dto/captures.dto';
import { ResolutionCaptureService } from '../knowledge/resolution-capture.service';
import { CaptureAdminService } from './capture-admin.service';

@ApiTags('chatbot/captures')
@ApiBearerAuth()
@Controller('chatbot/captures')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CapturesController {
  constructor(
    private readonly resolutionCaptureService: ResolutionCaptureService,
    private readonly captureAdmin: CaptureAdminService,
  ) {}

  @Post('preview')
  @ApiOperation({ summary: 'Build a capture preview (proposed title/content + LIVE duplicates) for a conversation.' })
  preview(@Body() dto: PreviewCaptureDto) {
    return this.resolutionCaptureService.preview({ conversationId: dto.conversationId });
  }

  @Get()
  @ApiOperation({ summary: 'List resolution captures with status/disposition/closed-at filters.' })
  list(@Query() q: ListCapturesDto) {
    return this.captureAdmin.list(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single capture with its document and originating conversation.' })
  get(@Param('id') id: string) {
    return this.captureAdmin.get(id);
  }

  @Post(':id/promote')
  @ApiOperation({ summary: 'Promote a captured DRAFT doc to LIVE (re-runs dedup unless forced).' })
  promote(@Param('id') id: string, @Body() dto: PromoteCaptureDto) {
    return this.captureAdmin.promote(id, { forcedDespiteDuplicate: dto.forcedDespiteDuplicate });
  }

  @Post(':id/discard')
  @ApiOperation({ summary: 'Discard a capture: archive its document and mark the capture discarded.' })
  discard(@Param('id') id: string, @Body() dto: DiscardCaptureDto) {
    return this.captureAdmin.discard(id, dto.reason);
  }
}
