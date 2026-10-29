import { Body, Controller, Delete, Get, Param, ParseEnumPipe, Put, UseGuards } from '@nestjs/common';
import { MalaysianState } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { StateLanguageMappingService } from './state-language-mapping.service';
import { UpsertMappingDto } from './dto/upsert-mapping.dto';

@Controller('state-language-mappings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StateLanguageMappingController {
  constructor(private readonly mappings: StateLanguageMappingService) {}

  @Get()
  list() {
    return this.mappings.listAll();
  }

  @Put(':state')
  async upsert(
    @Param('state', new ParseEnumPipe(MalaysianState)) state: MalaysianState,
    @Body() dto: UpsertMappingDto,
  ) {
    await this.mappings.upsert(state, dto.languages);
    return this.mappings.listAll();
  }

  @Delete(':state')
  async remove(@Param('state', new ParseEnumPipe(MalaysianState)) state: MalaysianState) {
    await this.mappings.clear(state);
    return this.mappings.listAll();
  }
}
