import { ApiProperty } from '@nestjs/swagger';
import { IsInteger } from '../../decorators/validator.decorator';
import { BasePagingDto } from '../../types/base.type';

export class CreateEventFeedbackDto {
  @ApiProperty({ required: true })
  @IsInteger
  rate: number;
  @ApiProperty({ required: true })
  content: string;
  @ApiProperty({ required: true })
  eventId: string;
}

export class FindEventFeedbackDto extends BasePagingDto {
}
