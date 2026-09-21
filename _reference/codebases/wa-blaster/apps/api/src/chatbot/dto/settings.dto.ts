import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

/**
 * Partial update of the `chatbot_settings` table. Every property maps 1:1 to a setting key
 * (snake_case to match the stored keys), so the controller can persist the body verbatim.
 * All fields are optional — only the provided keys are written.
 */
export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Master switch for the chatbot.' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'When true, the bot drafts but never auto-sends.' })
  @IsOptional()
  @IsBoolean()
  disable_auto_reply?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 1, description: 'Minimum draft confidence required to auto-send.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence_threshold?: number;

  @ApiPropertyOptional({ description: 'Business display name used in bot replies.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  business_name?: string;

  @ApiPropertyOptional({ example: '09:00', description: 'Start of business hours (HH:MM, local).' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'business_hours_start must be HH:MM' })
  business_hours_start?: string;

  @ApiPropertyOptional({ example: '18:00', description: "End of business hours (HH:MM; '24:00' = end of day)." })
  @IsOptional()
  @IsString()
  @Matches(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, { message: 'business_hours_end must be HH:MM or 24:00' })
  business_hours_end?: string;

  @ApiPropertyOptional({ example: 'Asia/Kuala_Lumpur', description: 'IANA timezone for business hours.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  business_hours_timezone?: string;

  @ApiPropertyOptional({ example: 'MON,TUE,WED,THU,FRI', description: 'Comma-separated business days.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  business_days?: string;

  @ApiPropertyOptional({ description: 'Phone number (E.164) used for human escalation.' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  escalation_phone?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 20, description: 'Number of knowledge chunks to retrieve per query.' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  retrieval_top_k?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1, description: 'Minimum cosine similarity for a retrieved chunk.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  retrieval_min_score?: number;
}
