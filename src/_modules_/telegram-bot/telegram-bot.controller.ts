import { Controller, Post, Body } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { ApiTags } from '@nestjs/swagger';
import { TelegramBotDto } from './telegram-bot.dto';

@Controller('telegram')
@ApiTags('telegram')
export class TelegramController {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  @Post('send-message')
  async sendMessage(@Body() body: TelegramBotDto) {
    const { username, message } = body;
    await this.telegramBotService.sendMessage(username, message);
    return { success: true, message: `Message sent to ${username}` };
  }
}
