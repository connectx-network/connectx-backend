import {ApiProperty, PartialType} from '@nestjs/swagger';
import { BasePagingDto } from 'src/types/base.type';
import {IsBoolean, IsNotEmpty} from "class-validator";
import {OptionalProperty} from "../../decorators/validator.decorator";

export class FindCityDto extends BasePagingDto {
  @OptionalProperty()
  query: string
  @OptionalProperty()
  isHighlighted: boolean
}

export class FindInterestedCityDto extends BasePagingDto {}

export class CreateCityDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  country: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  longitude: number;
}

export class UpdateCityDto extends PartialType(CreateCityDto) {}

export class UpdateCityHighlight {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  cityId: string;
  @ApiProperty({ required: true })
  @IsBoolean()
  isHighlighted: boolean
}