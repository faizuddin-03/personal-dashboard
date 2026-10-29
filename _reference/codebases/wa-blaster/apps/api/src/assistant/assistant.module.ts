import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TemplatesModule } from '../templates/templates.module';
import { BlastsModule } from '../blasts/blasts.module';
import { SegmentsModule } from '../segments/segments.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantPlanService } from './assistant-plan.service';
import { AssistantToolsService } from './assistant-tools.service';
import { AssistantLlm, OllamaAssistantLlm } from './assistant-llm';

@Module({
  imports: [AuthModule, PrismaModule, TemplatesModule, BlastsModule, SegmentsModule],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantPlanService,
    AssistantToolsService,
    { provide: AssistantLlm, useClass: OllamaAssistantLlm },
  ],
})
export class AssistantModule {}
