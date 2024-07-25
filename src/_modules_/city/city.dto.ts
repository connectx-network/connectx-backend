import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CityDto } from '../user/user.dto';
import { BasePagingDto } from 'src/types/base.type';
import { IsNotEmpty } from 'class-validator';

export class FindCityDto extends BasePagingDto {}
export class FindInterestedCityDto extends BasePagingDto {}

export class CreateCityDto extends CityDto {
  @ApiProperty({ default: false })
  @IsNotEmpty()
  interested: boolean;
}

export class UpdateCityDto extends PartialType(CreateCityDto) {}
