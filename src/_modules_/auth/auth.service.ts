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
  SignInAppleDto,
  SignInDto,
  SignInGoogleDto,
  VerifyAccountDto,
} from './auth.dto';
import { compare, hash } from 'bcrypt';
import * as moment from 'moment-timezone';
import { Prisma, User, UserCodeType } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { OtpEmailDto } from '../mail/mail.dto';
import * as process from 'process';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../firebase/firebase.service';
import * as crypto from 'crypto';
import * as InitDataNode from '@telegram-apps/init-data-node';

@Injectable()
export class AuthService {
  private timezone = process.env.DEFAULT_TIMEZONE;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
  ) {}

  // async create(createUserDto: CreateUserDto) {
  //   const { fullName, password, email, userRole } = createUserDto;
  //
  //   const createdUser = await this.prisma.user.findUnique({
  //     where: { email },
  //   });
  //
  //   if (createdUser) {
  //     if (!createdUser.activated) {
  //       throw new NotAcceptableException('User has not activated yet!');
  //     }
  //     throw new ConflictException(
  //       'Email is already used for an existing account!',
  //     );
  //   }
  //   const saltOrRounds = +process.env.USER_SALT;
  //   const encryptedPassword = await hash(password, saltOrRounds);
  //   const verifyCode = await this.generateUniqueCode();
  //   const expiredDate = moment().tz(this.timezone).add(3, 'minutes').toDate();
  //
  //   const createUserPayload: Prisma.UserUncheckedCreateInput = {
  //     email,
  //     fullName,
  //     password: encryptedPassword,
  //     userVerification: {
  //       create: {
  //         verifyCode,
  //         expiredDate,
  //         type: 'VERIFICATION',
  //       },
  //     },
  //   };
  //
  //   if (userRole) {
  //     createUserPayload.userRole = userRole;
  //   }
  //
  //   const user = await this.prisma.user.create({
  //     data: createUserPayload,
  //     include: {
  //       userVerification: true,
  //     },
  //   });
  //
  //   try {
  //     await this.sendVerifyAccountEmail({
  //       fullName: user.fullName,
  //       verifyCode: user.userVerification.verifyCode,
  //       expiredDate: user.userVerification.verifyCode,
  //       email: user.email,
  //     });
  //   } catch (err) {
  //     console.log(err);
  //     await this.prisma.user.delete({ where: { id: user.id } });
  //     throw err;
  //   }
  //
  //   return { success: true };
  // }async create(createUserDto: CreateUserDto) {
  //   const { fullName, password, email, userRole } = createUserDto;
  //
  //   const createdUser = await this.prisma.user.findUnique({
  //     where: { email },
  //   });
  //
  //   if (createdUser) {
  //     if (!createdUser.activated) {
  //       throw new NotAcceptableException('User has not activated yet!');
  //     }
  //     throw new ConflictException(
  //       'Email is already used for an existing account!',
  //     );
  //   }
  //   const saltOrRounds = +process.env.USER_SALT;
  //   const encryptedPassword = await hash(password, saltOrRounds);
  //   const verifyCode = await this.generateUniqueCode();
  //   const expiredDate = moment().tz(this.timezone).add(3, 'minutes').toDate();
  //
  //   const createUserPayload: Prisma.UserUncheckedCreateInput = {
  //     email,
  //     fullName,
  //     password: encryptedPassword,
  //     userVerification: {
  //       create: {
  //         verifyCode,
  //         expiredDate,
  //         type: 'VERIFICATION',
  //       },
  //     },
  //   };
  //
  //   if (userRole) {
  //     createUserPayload.userRole = userRole;
  //   }
  //
  //   const user = await this.prisma.user.create({
  //     data: createUserPayload,
  //     include: {
  //       userVerification: true,
  //     },
  //   });
  //
  //   try {
  //     await this.sendVerifyAccountEmail({
  //       fullName: user.fullName,
  //       verifyCode: user.userVerification.verifyCode,
  //       expiredDate: user.userVerification.verifyCode,
  //       email: user.email,
  //     });
  //   } catch (err) {
  //     console.log(err);
  //     await this.prisma.user.delete({ where: { id: user.id } });
  //     throw err;
  //   }
  //
  //   return { success: true };
  // }

  // private async sendVerifyAccountEmail({
  //   fullName,
  //   verifyCode,
  //   expiredDate,
  //   email,
  // }) {
  //   const payload: OtpEmailDto = {
  //     to: email,
  //     subject: 'Welcome To ConnectX',
  //     otp: verifyCode,
  //     expiredDate,
  //     fullName,
  //   };
  //
  //   return this.mailService.sendCreateAccountOtpEmail(payload);
  // }
  //
  // private async generateUniqueCode(): Promise<string> {
  //   let verifyCode: string;
  //   let isUnique = false;
  //
  //   while (!isUnique) {
  //     verifyCode = this.generateRandomCode();
  //     const existingRecord = await this.prisma.userVerification.findUnique({
  //       where: { verifyCode },
  //     });
  //     isUnique = !existingRecord;
  //   }
  //
  //   return verifyCode;
  // }
  //
  // private generateRandomCode(): string {
  //   const characters = '0123456789';
  //   let code = '';
  //   for (let i = 0; i < 6; i++) {
  //     code += characters.charAt(Math.floor(Math.random() * characters.length));
  //   }
  //   return code;
  // }
  //
  // async verify(verifyAccountDto: VerifyAccountDto) {
  //   const { email, verifyCode } = verifyAccountDto;
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       email,
  //       userVerification: {
  //         type: 'VERIFICATION',
  //       },
  //     },
  //     include: {
  //       userVerification: true,
  //     },
  //   });
  //   if (!user) {
  //     throw new NotFoundException('Not found user!');
  //   }
  //
  //   const { userVerification } = user;
  //
  //   if (verifyCode !== userVerification.verifyCode) {
  //     throw new NotAcceptableException('OTP is not correct!');
  //   }
  //
  //   if (moment().isAfter(userVerification.expiredDate)) {
  //     throw new NotAcceptableException('OTP is expired!');
  //   }
  //
  //   await this.prisma.$transaction([
  //     this.prisma.user.update({
  //       where: {
  //         id: user.id,
  //       },
  //       data: {
  //         activated: true,
  //       },
  //     }),
  //     this.prisma.userVerification.delete({
  //       where: {
  //         id: userVerification.id,
  //       },
  //     }),
  //   ]);
  //
  //   return { success: true };
  // }
  //
  // async verifyResetPasswordOtp(
  //   verifyAccountDto: VerifyAccountDto,
  // ): Promise<boolean> {
  //   const { email, verifyCode } = verifyAccountDto;
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       email,
  //       userVerification: {
  //         type: 'PASSWORD_RESET',
  //       },
  //     },
  //     include: {
  //       userVerification: true,
  //     },
  //   });
  //   if (!user) {
  //     throw new NotFoundException('Not found user!');
  //   }
  //
  //   const { userVerification } = user;
  //
  //   if (verifyCode !== userVerification.verifyCode) {
  //     throw new NotAcceptableException('OTP is not correct!');
  //   }
  //
  //   if (moment().isAfter(userVerification.expiredDate)) {
  //     throw new NotAcceptableException('OTP is expired!');
  //   }
  //   return true;
  // }
  //
  // private async requestNewOtp(email: string, type: UserCodeType) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { email },
  //   });
  //
  //   if (!user) {
  //     throw new NotFoundException('Not found user!');
  //   }
  //
  //   const verifyCode = await this.generateUniqueCode();
  //   const expiredDate = moment().tz(this.timezone).add(3, 'minutes').toDate();
  //
  //   const verificationCode = await this.prisma.userVerification.findUnique({
  //     where: {
  //       userId: user.id,
  //       type: type,
  //     },
  //   });
  //
  //   if (verificationCode) {
  //     await this.prisma.userVerification.update({
  //       where: {
  //         userId: user.id,
  //         type: type,
  //       },
  //       data: {
  //         verifyCode,
  //         expiredDate,
  //       },
  //     });
  //   } else {
  //     await this.prisma.userVerification.create({
  //       data: {
  //         userId: user.id,
  //         type: type,
  //         verifyCode,
  //         expiredDate,
  //       },
  //     });
  //   }
  //
  //   await this.sendVerifyAccountEmail({
  //     fullName: user.fullName,
  //     verifyCode: verifyCode,
  //     expiredDate: expiredDate,
  //     email: user.email,
  //   });
  //
  //   return { success: true };
  // }
  //
  // async renewVerificationCode(requestNewOtpDto: RequestNewOtpDto) {
  //   const { email } = requestNewOtpDto;
  //   return this.requestNewOtp(email, UserCodeType.VERIFICATION);
  // }
  //
  // async requestResetPassword(requestNewOtpDto: RequestNewOtpDto) {
  //   const { email } = requestNewOtpDto;
  //   return this.requestNewOtp(email, UserCodeType.PASSWORD_RESET);
  // }
  //
  // async resetPassword(resetPasswordDto: ResetPasswordDto) {
  //   const { email, password, otp } = resetPasswordDto;
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       email,
  //       userVerification: {
  //         type: 'PASSWORD_RESET',
  //       },
  //     },
  //     include: {
  //       userVerification: true,
  //     },
  //   });
  //   if (!user) {
  //     throw new NotFoundException('Not found user!');
  //   }
  //
  //   const { userVerification } = user;
  //
  //   if (otp !== userVerification.verifyCode) {
  //     throw new NotAcceptableException('OTP is not correct!');
  //   }
  //
  //   if (moment().isAfter(userVerification.expiredDate)) {
  //     throw new NotAcceptableException('OTP is expired!');
  //   }
  //
  //   const saltOrRounds = +process.env.USER_SALT;
  //   const encryptedPassword = await hash(password, saltOrRounds);
  //
  //   await this.prisma.$transaction([
  //     this.prisma.user.update({
  //       where: {
  //         id: user.id,
  //       },
  //       data: {
  //         password: encryptedPassword,
  //       },
  //     }),
  //     this.prisma.userVerification.delete({
  //       where: {
  //         id: userVerification.id,
  //       },
  //     }),
  //   ]);
  //
  //   return { success: true };
  // }
  //
  // async signIn(signInDto: SignInDto) {
  //   const { email, password, deviceToken } = signInDto;
  //   const user = await this.validateUser(email, password);
  //
  //   if (!user) {
  //     throw new NotFoundException('Not found user!');
  //   }
  //
  //   const { accessToken, refreshToken } = await this.generateTokens(
  //     user,
  //     deviceToken,
  //   );
  //
  //   return {
  //     user,
  //     accessToken,
  //     refreshToken,
  //   };
  // }
  //
  // private async generateTokens(user: User, deviceToken: string) {
  //   const { id, email, userRole } = user;
  //   const accessToken = this.jwtService.sign(
  //     { id, email, userRole },
  //     {
  //       expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  //       secret: process.env.ACCESS_TOKEN_SECRET,
  //     },
  //   );
  //
  //   const refreshToken = this.jwtService.sign(
  //     { sub: id },
  //     {
  //       expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
  //       secret: process.env.REFRESH_TOKEN_SECRET,
  //     },
  //   );
  //
  //   const expiredDate = moment().tz(this.timezone).add(1, 'years').toDate();
  //
  //   await this.prisma.userToken.create({
  //     data: {
  //       userId: user.id,
  //       refreshToken,
  //       expiredDate,
  //       deviceToken,
  //     },
  //   });
  //
  //   return {
  //     accessToken,
  //     refreshToken,
  //   };
  // }
  //
  // async validateUser(email: string, password: string): Promise<User> {
  //   const user = await this.prisma.user.findUnique({
  //     where: { email },
  //   });
  //
  //   if (!user) {
  //     throw new NotFoundException('Not found user!');
  //   }
  //
  //   if (!user.password) {
  //     throw new NotAcceptableException('You have not set up password yet!');
  //   }
  //
  //   const isMatch = await compare(password, user.password);
  //
  //   if (!isMatch) {
  //     throw new UnauthorizedException('Username or password is not correct!');
  //   }
  //
  //   if (!user.activated) {
  //     throw new NotAcceptableException('Please verify account before sign in!');
  //   }
  //
  //   delete user.password;
  //   return user;
  // }
  //
  // async signInGoogle(signInGoogleDto: SignInGoogleDto) {
  //   const { token, deviceToken } = signInGoogleDto;
  //   const firebaseAuth = this.firebaseService.getFirebaseApp().auth();
  //   const decodedToken = await firebaseAuth.verifyIdToken(token);
  //
  //   if (!decodedToken) {
  //     throw new NotAcceptableException('Failed!');
  //   }
  //
  //   const { email, uid } = decodedToken;
  //
  //   const userProfile = await firebaseAuth.getUser(uid);
  //
  //   const { displayName, photoURL, phoneNumber } = userProfile;
  //
  //   let user = await this.prisma.user.findUnique({ where: { email } });
  //
  //   if (!user) {
  //     user = await this.prisma.user.create({
  //       data: {
  //         email,
  //         fullName: displayName,
  //         avatarUrl: photoURL,
  //         phoneNumber,
  //         activated: true,
  //       },
  //     });
  //   }
  //
  //   const { accessToken, refreshToken } = await this.generateTokens(
  //     user,
  //     deviceToken,
  //   );
  //
  //   return {
  //     user,
  //     accessToken,
  //     refreshToken,
  //   };
  // }
  //
  // async signInApple(signInAppleDto: SignInAppleDto) {
  //   const { token, deviceToken } = signInAppleDto;
  //   const firebaseAuth = this.firebaseService.getFirebaseApp().auth();
  //   const decodedToken = await firebaseAuth.verifyIdToken(token);
  //
  //   if (!decodedToken) {
  //     throw new NotAcceptableException('Failed!');
  //   }
  //
  //   const { email } = decodedToken;
  //
  //   let user = await this.prisma.user.findUnique({ where: { email } });
  //
  //   const fullName = email.match(/^([^@]*)@/)[1];
  //
  //   if (!user) {
  //     user = await this.prisma.user.create({
  //       data: {
  //         email,
  //         fullName,
  //         activated: true,
  //       },
  //     });
  //   }
  //
  //   const { accessToken, refreshToken } = await this.generateTokens(
  //     user,
  //     deviceToken,
  //   );
  //
  //   return {
  //     user,
  //     accessToken,
  //     refreshToken,
  //   };
  // }
  //
  // async delete(userId: string) {
  //   await this.prisma.user.delete({
  //     where: { id: userId },
  //   });
  //
  //   return { success: true };
  // }
  //
  // async generateTonProof() {
  //   const randomBits = crypto.randomBytes(8);
  //
  //   const expiredTime = moment().tz(this.timezone).add(3, 'minutes').unix();
  //
  //   // Convert expiration time to buffer
  //   const expirationBuffer = Buffer.alloc(8);
  //   expirationBuffer.writeBigUInt64LE(BigInt(expiredTime));
  //
  //   // Generate payload hex buffer
  //   const payloadBuffer = crypto.randomBytes(48);
  //
  //   // Concatenate buffers
  //   const payload = Buffer.concat([
  //     randomBits,
  //     expirationBuffer,
  //     payloadBuffer,
  //   ]);
  //
  //   // Generate SHA2 signature
  //   const sha256 = crypto.createHash('sha256');
  //   sha256.update(payload);
  //   const signature = sha256.digest();
  //
  //   // Concatenate signature with payload
  //   const payloadWithSignature = Buffer.concat([payload, signature]);
  //
  //   return { tonProof: payloadWithSignature.toString('hex') };
  // }

  // async checkTonProof(tonProof: CheckTonProofDto) {
  //   const payloadBuffer = Buffer.from(tonProof.proof.payload, 'hex');
  //   const expirationBuffer = payloadBuffer.slice(8, 16);
  //   const expirationTimeSeconds = Number(
  //     expirationBuffer.readBigUInt64LE().toString(),
  //   );
  //   if (moment().unix() > expirationTimeSeconds) {
  //     throw new NotAcceptableException('Ton proof is expired!');
  //   }
  //
  //   let tondata;
  //   try {
  //     tondata = await axios.post(
  //       `https://${tonProof?.network === '-3' ? 'testnet.' : ''}tonapi.io/v2/tonconnect/stateinit`,
  //       { state_init: tonProof.proof.state_init },
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );
  //   } catch (error) {
  //     throw new InternalServerErrorException(error.message);
  //   }
  //
  //   if (!tondata) {
  //     throw new Error('Could not get address state stateinit');
  //   }
  //
  //   const { data } = tondata;
  //
  //   if (data.address !== tonProof.address) {
  //     throw new NotAcceptableException('Ton address is not correct!');
  //   }
  //
  //   const pubkey = Buffer.from(data.public_key, 'hex');
  //
  //   const parsedMessage = ConvertTonProofMessage(
  //     {
  //       account: {
  //         address: tonProof.address,
  //         walletStateInit: tonProof.proof.state_init,
  //       },
  //     },
  //     tonProof,
  //   );
  //
  //   const checkMessage = await CreateMessage(parsedMessage);
  //
  //   const isVerify = nacl.sign.detached.verify(
  //     checkMessage,
  //     parsedMessage.Signature,
  //     pubkey,
  //   );
  //
  //   if (!isVerify) {
  //     throw new NotAcceptableException('Ton signature is not correct!');
  //   }
  //
  //   let foundUser = await this.prisma.user.findFirst({
  //     where: {
  //       tonRawAddress: data.address,
  //     },
  //   });
  //
  //   if (!foundUser) {
  //     foundUser = await this.prisma.user.create({
  //       data: {
  //         tonRawAddress: data.address,
  //         fullName: data.address,
  //       },
  //     });
  //   }
  //
  //   const { accessToken, refreshToken } = await this.generateTokens(
  //     foundUser,
  //     '',
  //   );
  //
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { password, ...rest } = foundUser;
  //
  //   return { accessToken, refreshToken, user: rest };
  // }

  async verifyTelegramUser(telegramId: number) {
    const foundUser = await this.prisma.user.findFirst({
      where: {
        telegramId: `${telegramId}`,
      },
      select: {
        id: true,
        telegramId: true,
        fullName: true,
        gender: true,
        company: true,
        jobTitle: true,
        avatarUrl: true
      },
    });

    if (!foundUser) {
      throw new NotFoundException('Not found user!');
    }

    return foundUser;
  }

  async signUpTma(user: InitDataNode.User) {
    const { id, firstName, lastName, photoUrl } = user;

    const foundUser = await this.prisma.user.findFirst({
      where: {
        telegramId: `${id}`,
      },
      select: {
        id: true,
        telegramId: true,
        fullName: true,
        gender: true,
        company: true,
        jobTitle: true,
      },
    });

    if (foundUser) {
      throw new ConflictException('Id has created!');
    }

    return this.prisma.user.create({
      data: {
        telegramId: `${id}`,
        fullName: `${firstName} ${lastName}`,
        avatarUrl: photoUrl,
      },
      select: {
        id: true,
        telegramId: true,
        fullName: true,
        gender: true,
        company: true,
        jobTitle: true,
      }
    });
  }
}
