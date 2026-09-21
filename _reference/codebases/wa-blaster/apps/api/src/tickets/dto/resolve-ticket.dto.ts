import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CLOSE_DISPOSITIONS, CloseDisposition } from '../../chatbot/dto/conversations.dto';

/**
 * Optional body for POST /tickets/:id/resolve and /close. Lets the operator choose how the linked
 * chatbot conversation's resolution is captured into the KB. An absent/empty body ⇒ SKIP, preserving
 * the pre-Phase-2 behavior. Mirrors CloseConversationDto (minus forcedDespiteDuplicate, unused here).
 */
export class ResolveTicketDto {
  @ApiPropertyOptional({
    enum: CLOSE_DISPOSITIONS,
    description: 'IMPORT_LIVE publishes the resolution to the KB; SAVE_DRAFT stores a draft; SKIP (default) captures nothing.',
  })
  @IsOptional()
  @IsIn(CLOSE_DISPOSITIONS)
  disposition?: CloseDisposition;

  @ApiPropertyOptional({ description: 'Internal notes about how the ticket was resolved.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Cleaned-up answer used as the authoritative KB content (overrides the literal operator reply).' })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  editedAnswer?: string;
}
