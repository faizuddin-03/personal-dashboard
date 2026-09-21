import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class ListTemplatesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED'], { each: true })
  status?: ('DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED')[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(['MARKETING', 'UTILITY', 'AUTHENTICATION'], { each: true })
  category?: ('MARKETING' | 'UTILITY' | 'AUTHENTICATION')[];
}
