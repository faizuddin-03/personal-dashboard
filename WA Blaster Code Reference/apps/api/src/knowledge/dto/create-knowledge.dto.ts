import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateKnowledgeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

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
  @MaxLength(60)
  category!: string;

  @IsOptional()
  @IsEnum(['SYNCED', 'FROM_ESCALATION'])
  source?: 'SYNCED' | 'FROM_ESCALATION';

  @IsOptional()
  @IsEnum(['PUBLISHED', 'CANDIDATE', 'DISMISSED'])
  status?: 'PUBLISHED' | 'CANDIDATE' | 'DISMISSED';

  @IsOptional()
  @IsUUID()
  ticketId?: string;
}
