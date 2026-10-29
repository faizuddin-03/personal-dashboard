import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { ClassifierService } from './classifier.service';
import { YesNoDetector } from '../guardrails/yes-no.detector';

@Module({
  imports: [LlmModule],
  providers: [ClassifierService, YesNoDetector],
  exports: [ClassifierService, YesNoDetector],
})
export class ClassifierModule {}
