import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export const CAPTURE_STATUSES = [
  'pending',
  'captured_live',
  'captured_draft',
  'skipped_by_operator',
  'skipped_duplicate',
  'failed',
  'discarded',
];
export const CAPTURE_DISPOSITIONS = ['IMPORT_LIVE', 'SAVE_DRAFT', 'SKIP'];

export class PreviewCaptureDto {
  @ApiProperty({ description: 'Conversation to build a capture preview for (must have an operator reply on record).' })
  @IsUUID()
  conversationId!: string;
}

export class ListCapturesDto {
  @ApiPropertyOptional({ enum: CAPTURE_STATUSES, description: 'Filter by capture status.' })
  @IsOptional()
  @IsIn(CAPTURE_STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: CAPTURE_DISPOSITIONS, description: 'Filter by disposition.' })
  @IsOptional()
  @IsIn(CAPTURE_DISPOSITIONS)
  disposition?: string;

  @ApiPropertyOptional({ description: 'ISO date-time lower bound (inclusive) on closed_at.' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date-time upper bound (inclusive) on closed_at.' })
  @IsOptional()
  @IsISO8601()
  to?: string;

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

export class PromoteCaptureDto {
  @ApiPropertyOptional({ default: false, description: 'Promote even if a near-duplicate LIVE doc already exists.' })
  @IsOptional()
  @IsBoolean()
  forcedDespiteDuplicate?: boolean;
}

export class DiscardCaptureDto {
  @ApiPropertyOptional({ description: 'Why the captured doc was discarded (audit only).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
