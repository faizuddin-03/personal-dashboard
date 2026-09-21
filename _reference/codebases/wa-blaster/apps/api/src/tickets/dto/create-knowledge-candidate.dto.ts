import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateKnowledgeCandidateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  question!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  answer!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category!: string;
}
