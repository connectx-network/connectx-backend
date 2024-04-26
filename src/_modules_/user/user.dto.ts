import { Gender } from '@prisma/client';
import { OptionalProperty } from '../../decorators/validator.decorator';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
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
  @OptionalProperty()
  company: string;
  @OptionalProperty()
  description: string;
  @OptionalProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;
  @OptionalProperty({ isArray: true, type: UpdateUserInterestDto })
  interests: UpdateUserInterestDto[];
}

export class UpdateAvatarDto {
  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: Express.Multer.File;
}

export class ManualCreateUserDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  fullName: string;
  @OptionalProperty()
  nickname: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  phoneNumber: string;
  @OptionalProperty()
  country: string;
  @OptionalProperty()
  address: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  company: string;
  @OptionalProperty()
  jobTitle: string;
  @ApiProperty({ required: true, enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  eventId: string;
  @OptionalProperty({ type: 'string', isArray: true })
  @IsNotEmpty()
  phaseIds: string[];
  @OptionalProperty()
  knowEventBy: string;
}
