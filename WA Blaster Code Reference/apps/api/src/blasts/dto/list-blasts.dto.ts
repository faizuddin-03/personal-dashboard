import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional } from 'class-validator';

export class ListBlastsDto {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELED', 'FAILED'], { each: true })
  status?: ('DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELED' | 'FAILED')[];
}
