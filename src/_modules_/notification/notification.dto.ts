import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { BasePagingDto } from '../../types/base.type';
import { NotificationType } from '@prisma/client';

export class SendNotificationDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  title: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  body: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  receiverId: string;
}

export class FindNotificationDto extends BasePagingDto {}

export class CreateNotificationDto {
  title: string;
  body: string;
  senderId: string;
  receiverId: string;
  notificationType: NotificationType;
  objectId: string;
}
