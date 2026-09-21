import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSegmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsObject()
  filter?: Record<string, unknown>;
}
