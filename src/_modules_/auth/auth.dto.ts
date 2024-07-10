import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OptionalProperty } from '../../decorators/validator.decorator';
import { UserRole } from '@prisma/client';
import {BasePagingDto} from "../../types/base.type";

export class CreateUserDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsNotEmpty()
  fullName: string;
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
  @OptionalProperty({ enum: UserRole })
  userRole?: UserRole;
}

export class VerifyAccountDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsNotEmpty()
  verifyCode: string;
}
export class BaseUpdatePasswordDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsStrongPassword()
  password: string;
}

export class ResetPasswordDto extends BaseUpdatePasswordDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsNotEmpty()
  otp: string;
}

export class RequestNewOtpDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
export class SignInDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsNotEmpty()
  email: string;
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsNotEmpty()
  password: string;
  @OptionalProperty()
  deviceToken: string;
}

export class BaseSocialSignInDto {
  @ApiProperty({ required: true, description: 'This is required field' })
  @IsNotEmpty()
  token: string;
  @OptionalProperty()
  deviceToken: string;
}
export class SignInGoogleDto extends BaseSocialSignInDto {}
export class SignInAppleDto extends BaseSocialSignInDto {}

enum CHAIN {
  TESTNET = '-3',
  MAINNET = '-239',
}
export class CheckTonProofDto {
  @ApiProperty()
  address: string;

  @ApiProperty({ enum: CHAIN })
  @IsNotEmpty()
  network: CHAIN;

  @ApiProperty({
    type: 'object',
    properties: {
      state_init: { type: 'string' },
      timestamp: { type: 'number' },
      domain: {
        type: 'object',
        properties: {
          lengthBytes: { type: 'number' },
          value: { type: 'string' },
        },
      },
      payload: { type: 'string' },
      signature: { type: 'string' },
    },
  })
  proof: {
    state_init: string;
    timestamp: number;
    domain: {
      lengthBytes: number;
      value: string;
    };
    payload: string;
    signature: string;
  };
}

export class TelegramUserDto {
  allowsWriteToPm: boolean;
  firstName: string;
  id: number;
  languageCode: string;
  lastName: string;
  username: string;
}
