import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListKnowledgeDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['SYNCED', 'FROM_ESCALATION'])
  source?: 'SYNCED' | 'FROM_ESCALATION';

  @IsOptional()
  @IsEnum(['PUBLISHED', 'CANDIDATE', 'DISMISSED'])
  status?: 'PUBLISHED' | 'CANDIDATE' | 'DISMISSED';
}
