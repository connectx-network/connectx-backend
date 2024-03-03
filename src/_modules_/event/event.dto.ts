import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { OptionalProperty } from '../../decorators/validator.decorator';
import { BasePagingDto, BasePagingResponse } from '../../types/base.type';
import { Event, EventAssetType } from '@prisma/client';

export class CreateEventHostDto {
  @OptionalProperty()
  title: string;
  @OptionalProperty()
  url: string;
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
  name: string;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  eventCategoryId: string;

  @OptionalProperty()
  tiketPrice?: number;

  @ApiProperty({
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  eventDate: Date;

  @OptionalProperty()
  location: string;

  @OptionalProperty()
  description: string;

  @OptionalProperty()
  sponsors: string;

  @OptionalProperty()
  agenda: string;

  @OptionalProperty()
  speakers: string;

  @OptionalProperty({ isArray: true, type: CreateEventHostDto })
  createEventHostDto: CreateEventHostDto[];

  @OptionalProperty({ isArray: true, type: CreateEventAssetDto })
  createEventAssetDto: CreateEventAssetDto[];
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