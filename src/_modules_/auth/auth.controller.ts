import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import {CreateUserDto, RequestNewOtpDto, ResetPasswordDto, SignInDto, VerifyAccountDto} from './auth.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  @ApiBody({ type: CreateUserDto })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('/sign-in')
  @ApiBody({ type: SignInDto })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('/verify')
  @ApiBody({ type: VerifyAccountDto })
  async verify(@Body() verifyAccountDto: VerifyAccountDto) {
    return this.authService.verify(verifyAccountDto);
  }

  @Post('/reset-password')
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('/request/verify-code')
  @ApiBody({ type: RequestNewOtpDto })
  async requestRenewVerifyCode(@Body() requestNewOtpDto: RequestNewOtpDto) {
    return this.authService.renewVerificationCode(requestNewOtpDto);
  }
  @Post('/request/reset-password')
  @ApiBody({ type: RequestNewOtpDto })
  async requestResetPassword(@Body() requestNewOtpDto: RequestNewOtpDto) {
    return this.authService.requestResetPassword(requestNewOtpDto);
  }
}
