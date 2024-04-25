import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { BullModule } from '@nestjs/bull';
import { Queues } from '../../types/queue.type';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';
import { NftService } from '../nft/nft.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { QrCodeModule } from '../qr-code/qr-code.module';

@Module({
  imports: [
    UserModule,
    BullModule.registerQueue({
      name: Queues.mail,
    }),
    MailModule,
    QrCodeModule,
  ],
  controllers: [EventController],
  providers: [EventService, NftService, IpfsService],
})
export class EventModule {}
