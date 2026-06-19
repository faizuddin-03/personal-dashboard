import { Module, forwardRef } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { InboxController } from './inbox.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => WhatsappModule), AuthModule],
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
