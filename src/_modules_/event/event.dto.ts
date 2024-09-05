import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { IsBool, OptionalProperty } from '../../decorators/validator.decorator';
import { BasePagingDto, BasePagingResponse } from '../../types/base.type';
import { Event, EventAssetType, TicketType } from '@prisma/client';
import { Transform } from 'class-transformer';

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

export class SponsorDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  name: string;
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  description: string;
}

export class SocialDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  channelName: string;
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  url: string;
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
  cityId: string;

  @OptionalProperty()
  location: string;

  @OptionalProperty()
  description: string;

  @OptionalProperty()
  content: string;

  @OptionalProperty({ enum: TicketType })
  ticketType: TicketType;

  @OptionalProperty({ isArray: true })
  tags: string[];

  @OptionalProperty({ isArray: true, type: CreateEventHostDto })
  hosts: CreateEventHostDto[];

  @OptionalProperty({ isArray: true, type: CreateEventAssetDto })
  assets: CreateEventAssetDto[];

  @OptionalProperty({ isArray: true, type: SponsorDto })
  sponsors: SponsorDto[];

  @OptionalProperty({ isArray: true, type: SocialDto })
  socials: SocialDto[];
}

export class FindEventDto extends BasePagingDto {
  @OptionalProperty()
  userId: string;
  @OptionalProperty()
  @IsBool
  isHighlighted: boolean;
  @OptionalProperty({
    required: false,
    type: 'string',
    description: 'id1,id2,...',
  })
  @Transform((param) => {
    const idStrs: string[] = param.value.split(',');
    return idStrs.map((item) => item.trim());
  })
  categoryIds: string[];
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

export class UpdateHighlightEventDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  eventId: string;
  @ApiProperty({ required: true })
  @IsBoolean()
  isHighlighted: boolean;
}
