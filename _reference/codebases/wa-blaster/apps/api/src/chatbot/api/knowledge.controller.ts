import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import {
  CreateDocumentDto,
  ListDocumentsDto,
  SearchKnowledgeDto,
  UpdateDocumentDto,
} from '../dto/knowledge.dto';
import { DocumentService } from '../knowledge/document.service';
import { IngestionService } from '../knowledge/ingestion.service';
import { RetrievalService } from '../knowledge/retrieval.service';
import { KnowledgeStatsService } from './knowledge-stats.service';

@ApiTags('chatbot/knowledge')
@ApiBearerAuth()
@Controller('chatbot/knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class KnowledgeController {
  constructor(
    private readonly documents: DocumentService,
    private readonly ingestion: IngestionService,
    private readonly retrieval: RetrievalService,
    private readonly knowledgeStats: KnowledgeStatsService,
  ) {}

  @Get('documents')
  @ApiOperation({ summary: 'List knowledge documents with optional category/status/search filters.' })
  list(@Query() q: ListDocumentsDto) {
    return this.documents.list(q);
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Fetch a single document with its chunk count.' })
  get(@Param('id') id: string) {
    return this.documents.get(id);
  }

  @Get('documents/:id/stats')
  @ApiOperation({ summary: 'Per-document analytics: embeddings, citations/day, grounded %, recent uses.' })
  stats(@Param('id') id: string) {
    return this.knowledgeStats.stats(id);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Create a document from raw markdown; chunks + embeds when autoIngest.' })
  create(@Body() dto: CreateDocumentDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.documents.create({ ...dto, userId });
  }

  @Post('documents/upload')
  @ApiOperation({ summary: 'Create a document by uploading a .md/.markdown file (field "file").' })
  @ApiConsumes('multipart/form-data')
  // 2 MB multer backstop against abusive uploads; the <1 MB business rule is enforced below so
  // it returns a clean 400 (and is unit-testable without going through multer).
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { category?: string },
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded under field "file"');

    const lowerName = file.originalname.toLowerCase();
    if (!lowerName.endsWith('.md') && !lowerName.endsWith('.markdown')) {
      throw new BadRequestException('Only .md or .markdown files are accepted');
    }
    if (file.buffer.length >= 1024 * 1024) {
      throw new BadRequestException('File must be smaller than 1MB');
    }

    let contentMd: string;
    try {
      // fatal: true rejects any byte sequence that is not valid UTF-8.
      contentMd = new TextDecoder('utf-8', { fatal: true }).decode(file.buffer);
    } catch {
      throw new BadRequestException('File must be valid UTF-8 text');
    }

    const userId = (req.user as { id: string }).id;
    const name = file.originalname;
    // Title: the first markdown H1 ("# ...") if present, else the filename without extension.
    const h1 = contentMd.match(/^#\s+(.+?)\s*$/m);
    const title = h1 ? h1[1].trim() : name.replace(/\.(md|markdown)$/i, '');
    const category = body.category?.trim() || 'General';

    return this.documents.create({ name, title, category, contentMd, userId });
  }

  @Patch('documents/:id')
  @ApiOperation({ summary: 'Update document fields; re-ingests when contentMd changes.' })
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documents.update({ id, ...dto });
  }

  @Delete('documents/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a document; chunks and citations cascade.' })
  remove(@Param('id') id: string) {
    return this.documents.delete(id);
  }

  @Post('documents/:id/publish')
  @ApiOperation({ summary: 'Mark a document LIVE (requires at least one chunk).' })
  publish(@Param('id') id: string) {
    return this.documents.publish(id);
  }

  @Post('documents/:id/unpublish')
  @ApiOperation({ summary: 'Return a document to DRAFT, removing it from retrieval.' })
  unpublish(@Param('id') id: string) {
    return this.documents.unpublish(id);
  }

  @Post('documents/:id/reembed')
  @ApiOperation({ summary: 'Re-chunk and re-embed a document from its current content.' })
  reembed(@Param('id') id: string) {
    return this.ingestion.ingest(id);
  }

  @Post('search')
  @ApiOperation({ summary: 'Semantic search over LIVE chunks (admin preview of bot retrieval).' })
  search(@Body() dto: SearchKnowledgeDto) {
    // Shows raw dense-retrieval order; the relevance reranker (when CHATBOT_RERANK_ENABLED) is
    // applied only on the bot's answering path, so this preview can differ from what the bot sees.
    return this.retrieval.retrieve(dto.query, {
      topK: dto.topK,
      minScore: dto.minScore,
      category: dto.category,
    });
  }
}
