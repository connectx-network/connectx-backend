import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { OptionalProperty } from '../../decorators/validator.decorator';
import {BasePagingDto, BasePagingResponse} from "../../types/base.type";
import {Event} from "@prisma/client";

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
}

export class FindEventDto extends BasePagingDto {}

export class FindEventResponse extends BasePagingResponse<Event> {}