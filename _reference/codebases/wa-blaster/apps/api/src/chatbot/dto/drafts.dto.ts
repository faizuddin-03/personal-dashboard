import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BotDraftState } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class ListDraftsDto {
  @ApiPropertyOptional({ enum: BotDraftState, description: 'Filter by draft state (defaults to PENDING).' })
  @IsOptional()
  @IsEnum(BotDraftState)
  state?: BotDraftState;

  @ApiPropertyOptional({ description: 'Only drafts for this conversation.' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

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

export class EditDraftDto {
  @ApiProperty({
    description: 'Edited reply body; sent to the customer and recorded as the operator reply.',
    maxLength: 4096,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  body!: string;
}

export class RejectDraftDto {
  @ApiPropertyOptional({ description: 'Why the draft was rejected (audit only).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
