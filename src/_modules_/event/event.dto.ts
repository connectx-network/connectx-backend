import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { IsBool, OptionalProperty } from '../../decorators/validator.decorator';
import { BasePagingDto, BasePagingResponse } from '../../types/base.type';
import {
  Event,
  EventAssetType,
  EventScope,
  JoinedEventUserStatus,
  TicketType,
} from '@prisma/client';
import { Transform } from 'class-transformer';

export enum EventStatus {
  ON_GOING = 'ON_GOING',
  FINISHED = 'FINISHED',
}

export enum JoinedEventStatusParam {
  REGISTERED = 'REGISTERED',
  INVITED = 'INVITED',
  REJECTED = 'REJECTED',
  CHECKED_IN = 'CHECKED_IN',
}

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
  mapsUrl: string;

  @OptionalProperty()
  location: string;

  @OptionalProperty()
  description: string;

  @OptionalProperty()
  content: string;

  @OptionalProperty()
  numberOfTicket: number;

  @ApiProperty({ required: true, enum: EventScope })
  @IsEnum(EventScope)
  eventScope: EventScope;

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
  @OptionalProperty({
    required: false,
    type: 'string',
    description: 'id1,id2,...',
  })
  @Transform((param) => {
    const idStrs: string[] = param.value.split(',');
    return idStrs.map((item) => item.trim());
  })
  cityIds: string[];
  @OptionalProperty({ enum: EventStatus })
  status: EventStatus;
  @OptionalProperty()
  query: string;
}

export class FindFeedDto extends BasePagingDto {}

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

export class BaseInteractEventDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  eventId: string;
}

export class UpdateHighlightEventDto extends BaseInteractEventDto {
  @ApiProperty({ required: true })
  @IsBoolean()
  isHighlighted: boolean;
}

export class JoinEventDto extends BaseInteractEventDto {}

export class AddFavoriteDto extends BaseInteractEventDto {}

export class FindCreatedEventDto extends BasePagingDto {}

export class FindFavoriteEventDto extends BasePagingDto {}

export class EventLocation {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  latitude: string;
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  longitude: string;
}

export class UpdateEventDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  id: string;

  @OptionalProperty()
  title: string;

  @OptionalProperty()
  eventDate: Date;
  @OptionalProperty()
  eventEndDate: Date;

  @OptionalProperty()
  location: string;

  @OptionalProperty()
  mapsUrl: string;

  @OptionalProperty()
  description: string;

  @OptionalProperty()
  assetUrl: string;

  @OptionalProperty()
  content: string;

  @OptionalProperty()
  numberOfTicket: number;

  @OptionalProperty()
  eventScope: EventScope;
}

export class CreateInvitationDto extends BaseInteractEventDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  userId: string;
}

export class FindEventGuestDto extends BasePagingDto {
  @OptionalProperty({
    description: 'REGISTERED | INVITED | REJECTED | CHECKED_IN',
  })
  status: JoinedEventStatusParam;
  @OptionalProperty({
    type: 'string',
    description: 'fullName | telegramUsername | joinDate | checkInDate',
  })
  @Transform((param) => param.value.split(','))
  sort?: string[] = ['joinDate', 'desc'];
  @OptionalProperty()
  query: string;
}

export class UpdateGuestStatusDto extends BaseInteractEventDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  userId: string;
  @ApiProperty({
    required: true,
    description: 'REGISTERED | INVITED | REJECTED',
    enum: JoinedEventUserStatus,
  })
  @IsEnum(JoinedEventUserStatus)
  status: JoinedEventUserStatus;
}

export class CheckInByAdminDto extends BaseInteractEventDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  userId: string;
}

export class DeleteEventDto extends BaseInteractEventDto {}

export class CheckInByQrDto extends BaseInteractEventDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  userId: string;
}
