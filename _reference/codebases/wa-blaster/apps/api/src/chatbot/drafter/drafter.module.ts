import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { DrafterService } from './drafter.service';
import { CannedRepliesService } from './prompts/canned-replies';

@Module({
  imports: [LlmModule],
  providers: [DrafterService, CannedRepliesService],
  exports: [DrafterService, CannedRepliesService],
})
export class DrafterModule {}
