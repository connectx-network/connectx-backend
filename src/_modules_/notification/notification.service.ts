import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Notification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {SendNotificationDto} from "./notification.dto";

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async send(sendNotificationDto : SendNotificationDto) {
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
    await Promise.all(receiver.userTokens.map(userToken => {
      const {deviceToken} = userToken
      return firebase.messaging().send({
        notification: { title, body },
        token: deviceToken,
      });
    }))
  }
}
