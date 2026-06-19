import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChatbotDecisionKind } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListDecisionsDto {
  @ApiPropertyOptional({ enum: ChatbotDecisionKind, description: 'Filter by decision kind.' })
  @IsOptional()
  @IsEnum(ChatbotDecisionKind)
  kind?: ChatbotDecisionKind;

  @ApiPropertyOptional({ description: 'Only decisions for this conversation.' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'ISO date-time lower bound (inclusive) on created_at.' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date-time upper bound (inclusive) on created_at.' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class DecisionStatsQueryDto {
  @ApiPropertyOptional({
    default: 7,
    minimum: 1,
    maximum: 90,
    description: 'Window in days for the aggregate stats and the daily series.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number;
}
