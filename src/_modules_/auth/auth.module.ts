import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailModule } from '../mail/mail.module';
import {JwtModule} from "@nestjs/jwt";
import {JwtStrategy} from "../../strategies/jwt.strategy";
import {LocalStrategy} from "../../strategies/local.strategy";
import { UserModule } from "../user/user.module";

@Module({
  imports: [MailModule, JwtModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
