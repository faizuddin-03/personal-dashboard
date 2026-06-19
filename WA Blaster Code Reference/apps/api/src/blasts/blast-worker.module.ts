import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { LlmModule } from '../llm/llm.module';
import { BLAST_QUEUE } from './blasts.service';
import { BlastProcessor } from './blast.processor';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  imports: [
    PrismaModule,
    WhatsappModule,
    SystemSettingsModule,
    LlmModule, // @Global — must be registered here too: the worker graph doesn't include AppModule
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: BLAST_QUEUE }),
  ],
  providers: [
    BlastProcessor,
    RateLimiterService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new Redis(config.getOrThrow<string>('REDIS_URL')),
    },
  ],
})
export class BlastWorkerModule {}
