import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './auth.dto';
import { hash } from 'bcrypt';
import * as moment from 'moment-timezone';
import {MailerService} from "@nestjs-modules/mailer";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly mailerService: MailerService) {}

  async create(createUserDto: CreateUserDto) {
    const { fullName, password, email } = createUserDto;

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
    const expiredDate = moment(new Date()).add(5, 'minutes').toDate();
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        password: encryptedPassword,
        userVerification: {
          create: {
            verifyCode,
            expiredDate,
          },
        },
      },
    });

    

    {
      success: true;
    }
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
}
