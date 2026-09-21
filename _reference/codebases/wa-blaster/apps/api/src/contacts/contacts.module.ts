import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CsvImportService } from './csv-import.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContactsController],
  providers: [ContactsService, CsvImportService],
  exports: [ContactsService],
})
export class ContactsModule {}
