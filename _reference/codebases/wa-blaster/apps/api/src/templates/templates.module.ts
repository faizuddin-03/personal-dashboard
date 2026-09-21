import { Module, forwardRef } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TemplatesPoller } from './templates.poller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, forwardRef(() => WhatsappModule)],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplatesPoller],
  exports: [TemplatesService],
})
export class TemplatesModule {}
