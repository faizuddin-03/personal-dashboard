import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnowledgeDocumentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ListDocumentsDto {
  @ApiPropertyOptional({ description: 'Filter by category, e.g. Logistics / Billing / Resolved tickets.' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ enum: KnowledgeDocumentStatus })
  @IsOptional()
  @IsEnum(KnowledgeDocumentStatus)
  status?: KnowledgeDocumentStatus;

  @ApiPropertyOptional({ description: 'Free-text search over title/name/content.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class CreateDocumentDto {
  @ApiProperty({ description: 'Unique filename-style identifier, e.g. "shipping_table.md".' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Human-readable display title.' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Category, e.g. Logistics / Billing / General / Resolved tickets.' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category!: string;

  @ApiProperty({ description: 'Markdown body of the document.' })
  @IsString()
  @MinLength(1)
  contentMd!: string;

  @ApiPropertyOptional({ default: true, description: 'Chunk + embed immediately after creation.' })
  @IsOptional()
  @IsBoolean()
  autoIngest?: boolean;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ description: 'New markdown body; triggers re-ingest when changed.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  contentMd?: string;

  @ApiPropertyOptional({ default: true, description: 'Re-ingest when contentMd changed.' })
  @IsOptional()
  @IsBoolean()
  autoIngest?: boolean;
}

export class SearchKnowledgeDto {
  @ApiProperty({ description: 'Query text to embed and match against LIVE chunks.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  query!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 20, description: 'Max chunks to return.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1, description: 'Minimum cosine similarity for a chunk to count.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minScore?: number;

  @ApiPropertyOptional({ description: 'Restrict the search to one category.' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;
}
