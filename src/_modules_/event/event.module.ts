import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { BullModule } from '@nestjs/bull';
import { Queues } from '../../types/queue.type';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UserModule,
    BullModule.registerQueue({
      name: Queues.mail,
    }),
    MailModule,
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
