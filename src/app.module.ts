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
import { EventCategoryModule } from './_modules_/event-category/event-category.module';
import { EventModule } from './_modules_/event/event.module';
import { UserModule } from './_modules_/user/user.module';
import { UserConnectionModule } from './_modules_/user-connection/user-connection.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
    EventCategoryModule,
    EventModule,
    UserModule,
    UserConnectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
