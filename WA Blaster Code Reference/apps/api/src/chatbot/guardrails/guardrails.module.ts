import { Module } from '@nestjs/common';
import { LengthGuard } from './length.guard';
import { NoUnknownPromisesGuard } from './no-unknown-promises.guard';
import { NoAiSelfReferenceGuard } from './no-ai-self-reference.guard';
import { GuardrailsService } from './guardrails.service';
import { OptOutDetector } from './opt-out.detector';
import { ComplaintDetector } from './complaint.detector';

@Module({
  providers: [
    LengthGuard,
    NoUnknownPromisesGuard,
    NoAiSelfReferenceGuard,
    GuardrailsService,
    OptOutDetector,
    ComplaintDetector,
  ],
  exports: [GuardrailsService, OptOutDetector, ComplaintDetector],
})
export class GuardrailsModule {}
