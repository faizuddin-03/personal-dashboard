import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BlastsController } from './blasts.controller';
import { BlastsService, BLAST_QUEUE } from './blasts.service';
import { RateLimiterService } from './rate-limiter.service';
import { AuthModule } from '../auth/auth.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { InboxModule } from '../inbox/inbox.module';
import { StateLanguageMappingModule } from '../state-language-mapping/state-language-mapping.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => WhatsappModule),
    InboxModule,
    StateLanguageMappingModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: BLAST_QUEUE }),
  ],
  controllers: [BlastsController],
  providers: [
    BlastsService,
    RateLimiterService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new Redis(config.getOrThrow<string>('REDIS_URL')),
    },
  ],
  exports: [BlastsService, RateLimiterService, 'REDIS_CLIENT', BullModule],
})
export class BlastsModule {}
