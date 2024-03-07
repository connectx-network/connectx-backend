import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationJob, Queues } from 'src/types/queue.type';
import { NotificationService } from './notification.service';

@Processor(Queues.notification)
export class NotificationConsummer {
  constructor(private readonly notificationService: NotificationService) {}

  @Process(NotificationJob.sendNotification)
  async handleSendNotification({ data }: Job) {
    const { body, title, receiverId } = data;
    return this.notificationService.send({ body, title, receiverId });
  }
}
