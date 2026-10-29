import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListConversationsQuery {
  @IsEnum(['all', 'awaiting', 'replied', 'resolved'])
  tab!: 'all' | 'awaiting' | 'replied' | 'resolved';

  @IsOptional() @IsString()
  cursor?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 50;

  @IsOptional() @IsString()
  search?: string;
}
