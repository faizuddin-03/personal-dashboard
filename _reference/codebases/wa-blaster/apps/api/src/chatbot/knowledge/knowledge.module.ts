import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { LlmModule } from '../llm/llm.module';
import { ChunkerService } from './chunker.service';
import { RetrievalService } from './retrieval.service';
import { IngestionService } from './ingestion.service';
import { DocumentService } from './document.service';
import { TitleGeneratorService } from './title-generator.service';
import { ResolutionCaptureService } from './resolution-capture.service';
import { FollowUpDetector } from './follow-up.detector';
import { QueryContextualizerService } from './query-contextualizer.service';
import { RerankerService } from './reranker.service';
import { EnrichmentService } from './enrichment.service';

@Module({
  imports: [EmbeddingsModule, LlmModule],
  providers: [
    ChunkerService,
    RetrievalService,
    IngestionService,
    DocumentService,
    TitleGeneratorService,
    ResolutionCaptureService,
    FollowUpDetector,
    QueryContextualizerService,
    RerankerService,
    EnrichmentService,
  ],
  exports: [
    ChunkerService,
    RetrievalService,
    IngestionService,
    DocumentService,
    TitleGeneratorService,
    ResolutionCaptureService,
    FollowUpDetector,
    QueryContextualizerService,
    RerankerService,
    EnrichmentService,
  ],
})
export class KnowledgeModule {}
