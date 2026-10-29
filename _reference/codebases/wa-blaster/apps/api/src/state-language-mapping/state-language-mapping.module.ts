import { Module } from '@nestjs/common';
import { StateLanguageMappingService } from './state-language-mapping.service';
import { StateLanguageMappingController } from './state-language-mapping.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StateLanguageMappingController],
  providers: [StateLanguageMappingService],
  exports: [StateLanguageMappingService],
})
export class StateLanguageMappingModule {}
