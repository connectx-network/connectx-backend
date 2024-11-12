import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './_modules_/prisma/prisma.module';
import { FirebaseModule } from './_modules_/firebase/firebase.module';
import { FileModule } from './_modules_/file/file.module';
import { AuthModule } from './_modules_/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailModule } from './_modules_/mail/mail.module';
import { EventModule } from './_modules_/event/event.module';
import { UserModule } from './_modules_/user/user.module';
import { UserConnectionModule } from './_modules_/user-connection/user-connection.module';
import { NotificationModule } from './_modules_/notification/notification.module';
import { BullModule } from '@nestjs/bull';
import { QrCodeModule } from './_modules_/qr-code/qr-code.module';
import { CategoryModule } from './_modules_/category/category.module';
import { CityModule } from './_modules_/city/city.module';
import { OnboardingModule } from './_modules_/onboarding/onboarding.module';
import { S3Module } from './_modules_/s3/s3.module';
import { TelegramBotModule } from './_modules_/telegram-bot/telegram-bot.module';
import { HostModule } from './_modules_/host/host.module';
import { EventFeedbackModule } from './_modules_/event-feedback/event-feedback.module';
import { NftModule } from './_modules_/nft/nft.module';
import { CronJobModule } from './_modules_/cron-job/cron-job.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthTonModule } from './_modules_/auth-ton/auth-ton.module';
import { AuthSolanaModule } from './_modules_/auth-solana/auth-solana.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FirebaseModule,
    FileModule,
    AuthModule,
    MailerModule.forRoot({
      transport: {
        service: 'Google',
        host: process.env.MAIL_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_ADDRESS,
          pass: process.env.MAIL_APP_PASSWORD,
        },
      },
    }),
    MailModule,
    EventModule,
    UserModule,
    CityModule,
    OnboardingModule,
    UserConnectionModule,
    NotificationModule,
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    QrCodeModule,
    CategoryModule,
    S3Module,
    TelegramBotModule,
    HostModule,
    EventFeedbackModule,
    NftModule, 
    // ScheduleModule.forRoot(),
    CronJobModule, 
    AuthTonModule, 
    AuthSolanaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
