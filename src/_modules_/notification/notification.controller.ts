import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FindNotificationDto, SendNotificationDto } from './notification.dto';
import { ApiTags } from '@nestjs/swagger';
import { User } from '../../decorators/user.decorator';
import { Roles } from '../../decorators/role.decorator';
import { Role } from '../../types/auth.type';

@Controller('notification')
@ApiTags('/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('/send')
  async send(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationService.send(sendNotificationDto);
  }

  @Get('')
  @Roles(Role.ALL)
  async find(
    @User('id') userId: string,
    @Query() findNotificationDto: FindNotificationDto,
  ) {
    return this.notificationService.find(userId, findNotificationDto);
  }
}
