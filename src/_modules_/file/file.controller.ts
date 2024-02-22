import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MultiFileUploadDto, SingleUploadDto } from './file.dto';
import { FileService } from './file.service';

@Controller('file')
@ApiTags('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: SingleUploadDto })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() fileUploadDto: SingleUploadDto,
  ) {
    return await this.fileService.uploadFile(file, fileUploadDto);
  }

  @Post('multiple-upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiBody({ type: MultiFileUploadDto })
  async uploadMultipleFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() fileUploadDto: MultiFileUploadDto,
  ) {
    return this.fileService.uploadMultipleFile(files, fileUploadDto);
  }
}
