import { Gender } from '@prisma/client';
import { OptionalProperty } from '../../decorators/validator.decorator';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserInterestDto {
  @OptionalProperty()
  id: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  name: string;
}

export class UpdateUserDto {
  @OptionalProperty()
  fullName: string;
  @OptionalProperty()
  nickname: string;
  @OptionalProperty()
  phoneNumber: string;
  @OptionalProperty()
  country: string;
  @OptionalProperty()
  address: string;
  @OptionalProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;
  @OptionalProperty({isArray: true,type: UpdateUserInterestDto})
  interests: UpdateUserInterestDto[]
}

export class UpdateAvatarDto {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: Express.Multer.File;
}
