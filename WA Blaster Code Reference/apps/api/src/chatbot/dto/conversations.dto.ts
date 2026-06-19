import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationState } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Close dispositions, shared with the captures flow. */
export const CLOSE_DISPOSITIONS = ['IMPORT_LIVE', 'SAVE_DRAFT', 'SKIP'];
export type CloseDisposition = 'IMPORT_LIVE' | 'SAVE_DRAFT' | 'SKIP';

export class ListConversationsDto {
  @ApiPropertyOptional({ enum: ConversationState, description: 'Filter by conversation state.' })
  @IsOptional()
  @IsEnum(ConversationState)
  state?: ConversationState;

  @ApiPropertyOptional({ description: 'Filter by the assigned operator user id.' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Only pinned conversations when true.' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional({ description: 'Free-text search over the contact name/phone and message bodies.' })
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

export class UpdateConversationDto {
  @ApiPropertyOptional({ description: 'Pin/unpin the conversation in the inbox.' })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Replace the conversation tags.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ nullable: true, description: 'Assign to an operator (null to unassign).' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string | null;
}

export class ManualReplyDto {
  @ApiProperty({ description: 'Free-form operator reply, sent to the customer via WhatsApp.', maxLength: 4096 })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  body!: string;
}

export class CloseConversationDto {
  @ApiProperty({
    enum: CLOSE_DISPOSITIONS,
    description:
      'IMPORT_LIVE publishes the resolution to the KB; SAVE_DRAFT stores it as a draft for review; SKIP captures nothing.',
  })
  @IsIn(CLOSE_DISPOSITIONS)
  disposition!: CloseDisposition;

  @ApiPropertyOptional({ description: 'Internal notes about how the ticket was resolved.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNotes?: string;

  @ApiPropertyOptional({
    description: 'Cleaned-up answer used as the authoritative KB content (overrides the literal operator reply).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  editedAnswer?: string;

  @ApiPropertyOptional({ default: false, description: 'Capture even if a near-duplicate KB doc already exists.' })
  @IsOptional()
  @IsBoolean()
  forcedDespiteDuplicate?: boolean;
}
