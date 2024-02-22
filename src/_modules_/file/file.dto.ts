import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum FileType {
  USER_AVATAR = 'USER_AVATAR',
  EVENT_IMAGE = 'EVENT_IMAGE',
  CATEGORY_IMAGE = 'CATEGORY_IMAGE',
  APP_LOGO = 'APP_LOGO',
}

export class BaseFileUploadDto {
  @ApiProperty({ enum: FileType, required: true })
  @IsEnum(FileType)
  fileType: FileType;
}

export class SingleUploadDto extends BaseFileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: Express.Multer.File;
}

export class MultiFileUploadDto extends BaseFileUploadDto {
  @ApiProperty({ format: 'binary', required: true })
  files: Array<Express.Multer.File>;
}
