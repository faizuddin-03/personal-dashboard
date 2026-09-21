import { Module } from '@nestjs/common';
import { CannedRepliesService } from './canned-replies.service';
import { CannedRepliesController } from './canned-replies.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // PrismaService is @Global
  controllers: [CannedRepliesController],
  providers: [CannedRepliesService],
})
export class CannedRepliesModule {}
