import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { CsvImportService, ImportResult } from './csv-import.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsDto } from './dto/list-contacts.dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(
    private readonly contacts: ContactsService,
    private readonly csv: CsvImportService,
  ) {}

  @Get()
  list(@Query() q: ListContactsDto) {
    return this.contacts.list(q);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<ImportResult> {
    if (!file) throw new BadRequestException('No file uploaded under field "file"');
    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }
    const userId = (req.user as { id: string }).id;
    return this.csv.import(file.buffer, `csv:${file.originalname}`, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contacts.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateContactDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.contacts.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contacts.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.contacts.remove(id);
  }
}
