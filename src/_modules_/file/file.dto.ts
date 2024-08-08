import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FileType } from '@prisma/client';

export class BaseFileUploadDto {
  @ApiProperty({ enum: FileType, required: true })
  @IsEnum(FileType)
  fileType: FileType;
}

export class SingleUploadDto extends BaseFileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: Express.Multer.File;
}

export class DeleteFileDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  url: string
}