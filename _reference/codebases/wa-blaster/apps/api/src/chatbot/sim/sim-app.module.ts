import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatbotModule } from '../chatbot.module';

/**
 * Minimal Nest context for the CLI simulator: just the chatbot graph (orchestrator + decision engine
 * + knowledge/RAG + settings) over Prisma and a BullMQ root. Deliberately excludes the rest of
 * AppModule — blasts, autopilot, analytics, ScheduleModule cron jobs, etc. — so a long-lived
 * interactive session stays small instead of accumulating memory from app-wide background jobs
 * (booting the full AppModule and idling at the prompt eventually exhausts the Node heap).
 *
 * ChatbotModule pulls in ConversationsModule, which registers the resolution-capture queue, so a
 * Bull root is required here (in AppModule it comes from BlastsModule).
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ connection: { url: config.getOrThrow<string>('REDIS_URL') } }),
    }),
    ChatbotModule,
  ],
})
export class SimAppModule {}
