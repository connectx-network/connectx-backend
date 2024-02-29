import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import {BasePagingDto} from "../../types/base.type";

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

export class FindNotificationDto extends BasePagingDto{}