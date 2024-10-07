import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramController } from './telegram-bot.controller';

@Module({
  providers: [TelegramBotService],
  exports: [TelegramBotService],
  controllers: [TelegramController],
})
export class TelegramBotModule {}
