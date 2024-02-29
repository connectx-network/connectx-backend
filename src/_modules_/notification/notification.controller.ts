import {Body, Controller, Post} from '@nestjs/common';
import { NotificationService } from './notification.service';
import {SendNotificationDto} from "./notification.dto";

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post("/send")
  async send(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationService.send(sendNotificationDto)
  }
}
