import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OptionalProperty } from '../../decorators/validator.decorator';
import { UserRole } from '@prisma/client';

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

export class ResetPasswordDto extends BaseUpdatePasswordDto{
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
}