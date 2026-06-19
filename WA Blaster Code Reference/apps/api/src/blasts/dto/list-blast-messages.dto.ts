import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MessageStatus } from '@prisma/client';

export class ListBlastMessagesDto {
  @IsOptional() @IsEnum(MessageStatus)
  status?: MessageStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number = 25;
}
