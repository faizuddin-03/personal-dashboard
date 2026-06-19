import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Note: status transitions go through POST /:id/publish | /:id/dismiss; `source` is immutable after creation — neither is updatable here.
export class UpdateKnowledgeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  question?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  answer?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category?: string;
}
