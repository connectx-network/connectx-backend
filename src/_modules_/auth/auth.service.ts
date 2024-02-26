import {
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  RequestNewOtpDto,
  ResetPasswordDto,
  SignInDto,
  VerifyAccountDto,
} from './auth.dto';
import { compare, hash } from 'bcrypt';
import * as moment from 'moment-timezone';
import { Prisma, User, UserCodeType } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { OtpEmailDto } from '../mail/mail.dto';
import * as process from 'process';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private timezone = process.env.DEFAULT_TIMEZONE;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { fullName, password, email, userRole } = createUserDto;

    const createdUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (createdUser) {
      throw new ConflictException(
        'Email is already used for an existing account!',
      );
    }
    const saltOrRounds = +process.env.USER_SALT;
    const encryptedPassword = await hash(password, saltOrRounds);
    const verifyCode = await this.generateUniqueCode();
    const expiredDate = moment().tz(this.timezone).add(3, 'minutes').toDate();

    const createUserPayload: Prisma.UserUncheckedCreateInput = {
      email,
      fullName,
      password: encryptedPassword,
      userVerification: {
        create: {
          verifyCode,
          expiredDate,
          type: 'VERIFICATION',
        },
      },
    };

    if (userRole) {
      createUserPayload.userRole = userRole;
    }

    const user = await this.prisma.user.create({
      data: createUserPayload,
      include: {
        userVerification: true,
      },
    });

    try {
      await this.sendVerifyAccountEmail({
        fullName: user.fullName,
        verifyCode: user.userVerification.verifyCode,
        expiredDate: user.userVerification.verifyCode,
        email: user.email,
      });
    } catch (err) {
      console.log(err);
      await this.prisma.user.delete({ where: { id: user.id } });
      throw err;
    }

    return { success: true };
  }

  private async sendVerifyAccountEmail({
    fullName,
    verifyCode,
    expiredDate,
    email,
  }) {
    const payload: OtpEmailDto = {
      to: email,
      subject: 'Welcome To ConnectX',
      otp: verifyCode,
      expiredDate,
      fullName,
    };

    return this.mailService.sendCreateAccountOtpEmail(payload);
  }

  private async generateUniqueCode(): Promise<string> {
    let verifyCode: string;
    let isUnique = false;

    while (!isUnique) {
      verifyCode = this.generateRandomCode();
      const existingRecord = await this.prisma.userVerification.findUnique({
        where: { verifyCode },
      });
      isUnique = !existingRecord;
    }

    return verifyCode;
  }

  private generateRandomCode(): string {
    const characters = '0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  async verify(verifyAccountDto: VerifyAccountDto) {
    const { email, verifyCode } = verifyAccountDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
        userVerification: {
          type: 'VERIFICATION',
        },
      },
      include: {
        userVerification: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const { userVerification } = user;

    if (verifyCode !== userVerification.verifyCode) {
      throw new NotAcceptableException('OTP is not correct!');
    }

    if (moment().isAfter(userVerification.expiredDate)) {
      throw new NotAcceptableException('OTP is expired!');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          activated: true,
        },
      }),
      this.prisma.userVerification.delete({
        where: {
          id: userVerification.id,
        },
      }),
    ]);

    return { success: true };
  }

  private async requestNewOtp(email: string, type: UserCodeType) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const verifyCode = await this.generateUniqueCode();
    const expiredDate = moment().tz(this.timezone).add(3, 'minutes').toDate();

    const verificationCode = await this.prisma.userVerification.findUnique({
      where: {
        userId: user.id,
        type: type,
      },
    });

    if (verificationCode) {
      await this.prisma.userVerification.update({
        where: {
          userId: user.id,
          type: type,
        },
        data: {
          verifyCode,
          expiredDate,
        },
      });
    } else {
      await this.prisma.userVerification.create({
        data: {
          userId: user.id,
          type: type,
          verifyCode,
          expiredDate,
        },
      });
    }

    await this.sendVerifyAccountEmail({
      fullName: user.fullName,
      verifyCode: verifyCode,
      expiredDate: expiredDate,
      email: user.email,
    });

    return { success: true };
  }

  async renewVerificationCode(requestNewOtpDto: RequestNewOtpDto) {
    const { email } = requestNewOtpDto;
    return this.requestNewOtp(email, UserCodeType.VERIFICATION);
  }

  async requestResetPassword(requestNewOtpDto: RequestNewOtpDto) {
    const { email } = requestNewOtpDto;
    return this.requestNewOtp(email, UserCodeType.PASSWORD_RESET);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, password, otp } = resetPasswordDto;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
        userVerification: {
          type: 'PASSWORD_RESET',
        },
      },
      include: {
        userVerification: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const { userVerification } = user;

    if (otp !== userVerification.verifyCode) {
      throw new NotAcceptableException('OTP is not correct!');
    }

    if (moment().isAfter(userVerification.expiredDate)) {
      throw new NotAcceptableException('OTP is expired!');
    }

    const saltOrRounds = +process.env.USER_SALT;
    const encryptedPassword = await hash(password, saltOrRounds);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: encryptedPassword,
        },
      }),
      this.prisma.userVerification.delete({
        where: {
          id: userVerification.id,
        },
      }),
    ]);

    return { success: true };
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Username or password is not correct!');
    }

    if (!user.activated) {
      throw new NotAcceptableException('Please verify account before sign in!');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  private async generateTokens(user: User) {
    const { id, email, userRole } = user;
    const accessToken = this.jwtService.sign(
      { id, email, userRole },
      {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
        secret: process.env.ACCESS_TOKEN_SECRET,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: id },
      {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
        secret: process.env.REFRESH_TOKEN_SECRET,
      },
    );

    const expiredDate = moment().tz(this.timezone).add(1, 'years').toDate();

    await this.prisma.userToken.create({
      data: {
        userId: user.id,
        refreshToken,
        expiredDate,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Username or password is not correct!');
    }

    if (!user.activated) {
      throw new NotAcceptableException('Please verify account before sign in!');
    }

    delete user.password;
    return user;
  }
}
