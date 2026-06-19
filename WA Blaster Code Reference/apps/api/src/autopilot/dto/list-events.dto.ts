import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListEventsDto {
  @IsOptional() @IsEnum(['AUTO_REPLIED', 'ESCALATED', 'OPTED_OUT', 'SKIPPED'])
  action?: 'AUTO_REPLIED' | 'ESCALATED' | 'OPTED_OUT' | 'SKIPPED';

  @IsOptional() @IsUUID()
  contactId?: string;
}
