import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { QrCodeModule } from '../qr-code/qr-code.module';
import { MailConsummer } from './mail.consummer';
import { BullModule } from '@nestjs/bull';
import { Queues } from '../../types/queue.type';

@Module({
  imports: [
    QrCodeModule,
    BullModule.registerQueue({
      name: Queues.mail,
    }),
  ],
  providers: [MailService, MailConsummer],
  exports: [MailService],
})
export class MailModule {}
