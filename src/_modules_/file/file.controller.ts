import {
  Body,
  Controller, Delete,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {DeleteFileDto, SingleUploadDto} from './file.dto';
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

  @Delete('')
  @ApiBody({ type: DeleteFileDto })
  async delete(
      @Body() deleteFileDto: DeleteFileDto,
  ) {
    return await this.fileService.delete(deleteFileDto);
  }
}
