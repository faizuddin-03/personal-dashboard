import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { UpdateSettingsDto } from '../dto/settings.dto';
import { ChatbotSettingsService, SettingValue } from '../settings/chatbot-settings.service';

@ApiTags('chatbot/settings')
@ApiBearerAuth()
@Controller('chatbot/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SettingsController {
  constructor(private readonly settings: ChatbotSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'List all chatbot settings, coerced to their real JS types.' })
  getAll() {
    return this.settings.getAll();
  }

  @Patch()
  @ApiOperation({ summary: 'Update one or more chatbot settings; returns the refreshed set.' })
  async update(@Body() dto: UpdateSettingsDto) {
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      await this.settings.patch(key, value as SettingValue);
    }
    return this.settings.getAll();
  }
}
