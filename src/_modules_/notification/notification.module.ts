import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { BullModule } from '@nestjs/bull';
import { Queues } from '../../types/queue.type';

@Module({
  imports: [
    FirebaseModule,
    BullModule.registerQueue({
      name: Queues.notification,
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
