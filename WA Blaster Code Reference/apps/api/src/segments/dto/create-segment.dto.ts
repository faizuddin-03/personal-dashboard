import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSegmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsObject()
  filter!: Record<string, unknown>;
}
