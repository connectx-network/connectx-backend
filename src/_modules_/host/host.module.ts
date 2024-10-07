import { Module } from '@nestjs/common';
import { HostService } from './host.service';
import { HostController } from './host.controller';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

@Module({
  providers: [HostService, TelegramBotService],
  controllers: [HostController],
})
export class HostModule {}
