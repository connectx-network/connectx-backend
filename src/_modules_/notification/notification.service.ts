import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateNotificationDto,
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
      where: {
        id: receiverId,
        userTokens: {
          some: {
            deviceToken: {
              not: null,
            },
          },
        },
      },
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
        if (deviceToken) {
          return firebase.messaging().send({
            notification: { title, body },
            token: deviceToken,
          });
        }
        return;
      }),
    );

    return { success: true };
  }

  async create(createNotificationDto: CreateNotificationDto) {
    const { title, body, receiverId } = createNotificationDto;
    await this.prisma.notification.create({
      data: createNotificationDto,
    });
    await this.send({
      title,
      body,
      receiverId,
    });
    // await this.notificationTaskQueue.add('send-notification', {
    //   title,
    //   body,
    //   receiverId,
    // });
    return { success: true };

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
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where: findNotificationCondtion }),
    ]);

    return {
      ...getDefaultPaginationReponse(findNotificationDto, count),
      data: notifications,
    };
  }
}
