import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramBotService {
  private bot: Telegraf;
  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_KEY);
    // this.bot.start((ctx) => {
    //   ctx.reply('Welcome');
    // });
  }

  async sendMessage(chatId: number, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error sending message to Telegram user:', error);
      throw new Error('Failed to send message');
    }
  }
}
