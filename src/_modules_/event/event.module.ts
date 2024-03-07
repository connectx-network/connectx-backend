import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { BullModule } from '@nestjs/bull';
import { Queues } from '../../types/queue.type';

@Module({
  imports: [
    BullModule.registerQueue({
      name: Queues.mail,
    }),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
