import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  FindNotificationDto,
  SendNotificationDto,
} from './notification.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Prisma } from '@prisma/client';
import { getDefaultPaginationReponse } from '../../utils/pagination.util';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
    @InjectQueue('notification') private readonly notificationTaskQueue: Queue,
  ) {}

  async send(sendNotificationDto: SendNotificationDto) {
    const { body, title, receiverId } = sendNotificationDto;
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
      include: {
        userTokens: {
          select: {
            deviceToken: true,
          },
        },
      },
    });
    if (!receiver) {
      throw new NotFoundException('Not found user!');
    }
    const firebase = this.firebaseService.getFirebaseApp();
    await Promise.all(
      receiver.userTokens.map((userToken) => {
        const { deviceToken } = userToken;
        return firebase.messaging().send({
          notification: { title, body },
          token: deviceToken,
        });
      }),
    );
  }

  async find(userId: string, findNotificationDto: FindNotificationDto) {
    const { size, page } = findNotificationDto;
    const skip = (page - 1) * size;

    const findNotificationCondtion: Prisma.NotificationWhereInput = {};

    if (userId) {
      findNotificationCondtion.receiverId = userId;
    }

    const [notifications, count] = await Promise.all([
      this.prisma.notification.findMany({
        skip,
        where: findNotificationCondtion,
        take: size,
      }),
      this.prisma.notification.count({ where: findNotificationCondtion }),
    ]);

    return {
      ...getDefaultPaginationReponse(findNotificationDto, count),
      data: notifications,
    };
  }
}