import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListTicketsDto {
  @IsOptional()
  @IsEnum(['active', 'closed'])
  tab?: 'active' | 'closed';

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], { each: true })
  status?: ('OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED')[];

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
