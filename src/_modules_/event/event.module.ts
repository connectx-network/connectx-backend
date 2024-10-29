import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { BullModule } from '@nestjs/bull';
import { Queues } from '../../types/queue.type';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';
import { NftModule } from '../nft/nft.module';

@Module({
  imports: [
    UserModule,
    BullModule.registerQueue({
      name: Queues.mail,
    }),
    MailModule,
    NftModule
  ],
  controllers: [EventController],
  providers: [EventService, TelegramBotService],
})
export class EventModule {}
