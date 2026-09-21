import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { WhatsappCloudApiService } from './whatsapp-cloud-api.service';
import { WebhookController } from './webhook.controller';
import { TemplatesModule } from '../templates/templates.module';
import { BlastsModule } from '../blasts/blasts.module';
import { AutopilotModule } from '../autopilot/autopilot.module';
import { CHATBOT_INBOUND_QUEUE } from '../chatbot/inbound/chatbot-inbound.queue';
import { ConversationsModule } from '../chatbot/conversations/conversations.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => TemplatesModule),
    forwardRef(() => BlastsModule),
    forwardRef(() => AutopilotModule),
    // Producer side of the fast-ack chatbot path: the controller enqueues here and returns 200
    // immediately; ChatbotInboundProcessor (worker) consumes. The Bull *root* is the app-global one
    // from BlastsModule; this only registers the queue so @InjectQueue resolves in the controller.
    // (ChatbotModule is no longer imported — the controller enqueues instead of calling the service;
    // the chatbot stack itself is wired into the API via AppModule.)
    BullModule.registerQueue({ name: CHATBOT_INBOUND_QUEUE }),
    // ConversationService persists the chatbot inbound at receipt (in the controller) so reply-quote
    // ordering works; PrismaService (for the contact lookup) is @Global.
    ConversationsModule,
  ],
  controllers: [WebhookController],
  providers: [WhatsappCloudApiService],
  exports: [WhatsappCloudApiService],
})
export class WhatsappModule {}
