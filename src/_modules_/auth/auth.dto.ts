import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
