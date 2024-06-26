import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import {
  CheckTonProofDto,
  CreateUserDto,
  RequestNewOtpDto,
  ResetPasswordDto,
  SignInAppleDto,
  SignInDto,
  SignInGoogleDto,
  VerifyAccountDto,
} from './auth.dto';
import { User } from '../../decorators/user.decorator';
import { UserService } from '../user/user.service';
import { Roles } from '../../decorators/role.decorator';
import { Role } from '../../types/auth.type';
import { UserTransformInterceptor } from '../../interceptors/user.interceptor';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

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

  @Post('/sign-in/google')
  @ApiBody({ type: SignInGoogleDto })
  async signInGoogle(@Body() signInGoogleDto: SignInGoogleDto) {
    return this.authService.signInGoogle(signInGoogleDto);
  }
  @Post('/sign-in/apple')
  @ApiBody({ type: SignInAppleDto })
  async signInApple(@Body() signInAppleDto: SignInAppleDto) {
    return this.authService.signInApple(signInAppleDto);
  }

  @Post('/verify-otp/account')
  @ApiBody({ type: VerifyAccountDto })
  async verify(@Body() verifyAccountDto: VerifyAccountDto) {
    return this.authService.verify(verifyAccountDto);
  }

  @Post('/verify-otp/reset-password')
  @ApiBody({ type: VerifyAccountDto })
  async verifyResetPassword(@Body() verifyAccountDto: VerifyAccountDto) {
    return this.authService.verifyResetPasswordOtp(verifyAccountDto);
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

  @Get('/self')
  @Roles(Role.ALL)
  @UseInterceptors(UserTransformInterceptor)
  async getSelfInformation(@User('id') userId: string) {
    return this.userService.findOne(userId);
  }

  @Delete()
  @Roles(Role.ALL)
  async delete(@User('id') userId: string) {
    return this.authService.delete(userId);
  }

  @Post('ton/generate-payload')
  async generateTonProof() {
    return this.authService.generateTonProof();
  }

  @Post('ton/check-ton-proof')
  async checkTonProof(@Body() data: CheckTonProofDto) {
    return this.authService.checkTonProof(data);
  }
}
