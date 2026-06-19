import { IsOptional, IsUUID } from 'class-validator';

export class AssignTicketDto {
  /** Optional — defaults to the requesting user (self-assign). */
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
