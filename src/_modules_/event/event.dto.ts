import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { OptionalProperty } from '../../decorators/validator.decorator';
import { BasePagingDto, BasePagingResponse } from '../../types/base.type';
import {Event, EventAssetType, TicketType} from '@prisma/client';

export class CreateEventHostDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  userId: string;
}

export class CreateEventAssetDto {
  @ApiProperty({ required: true })
  url: string;
  @ApiProperty({ required: true, enum: EventAssetType })
  @IsEnum(EventAssetType)
  type: EventAssetType;
}

export class CreateEventDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  eventCategoryId: string;

  @OptionalProperty()
  ticketPrice?: number;

  @ApiProperty({
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  eventDate: Date;
  @ApiProperty({
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  eventEndDate: Date;

  @OptionalProperty()
  cityId: number;

  @OptionalProperty()
  location: string;

  @OptionalProperty()
  description: string;

  @OptionalProperty()
  content: string;

  @OptionalProperty({enum: TicketType})
  ticketType: TicketType;

  @OptionalProperty({isArray: true})
  tags: string[];

  @OptionalProperty({ isArray: true, type: CreateEventHostDto })
  hosts: CreateEventHostDto[];

  @OptionalProperty({ isArray: true, type: CreateEventAssetDto })
  assets: CreateEventAssetDto[];
}

export class FindEventDto extends BasePagingDto {
  @OptionalProperty()
  userId: string;
}

export class FindOneEventDto {
  @OptionalProperty()
  userId: string;
}

export class FindEventResponse extends BasePagingResponse<Event> {}

export class CreateEventInvitationDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  eventId: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  receiverId: string;
}

export class FindJoinedEventUserDto extends BasePagingDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  eventId: string;
  @OptionalProperty()
  userId: string;
}

export class FindUserEventDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  eventId: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  userId: string;
}

export class ManualImportEventUserDto {
  @ApiProperty({ required: true, isArray: true, type: 'string' })
  @IsNotEmpty()
  emails: string[];
  @ApiProperty({ required: true })
  @IsNotEmpty()
  eventId: string;
}
