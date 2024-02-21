import { ApiProperty } from '@nestjs/swagger';
import { IsInteger } from '../decorators/validator.decorator';

export class BasePagingResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalPages: number;
  totalElement: number;
}

export class BasePagingDto {
  @ApiProperty({
    required: false,
    description: 'Number of page',
  })
  @IsInteger
  readonly page: number = 1;
  @ApiProperty({
    required: false,
    description: 'Number of records per page',
  })
  @IsInteger
  readonly size: number = 9;
}
