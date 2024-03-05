import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ConnectionStatus,
  FindUserConnectionDto,
  FindUserConnectionResponse,
} from './user-connection.dto';
import { getDefaultPaginationReponse } from '../../utils/pagination.util';
import { NotificationMessage } from '../../types/notification.type';
import {NotificationService} from "../notification/notification.service";

@Injectable()
export class UserConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async create(userId: string, targetId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      throw new NotFoundException('Not found user!');
    }

    const createdUserConnections = await this.prisma.userConnection.findFirst({
      where: {
        userId,
        followUserId: targetId,
      },
    });

    if (createdUserConnections) {
      throw new ConflictException('You are following this user!');
    }

    const createUserConnectionPayload: Prisma.UserConnectionUncheckedCreateInput =
      {
        accepted: true,
        followUserId: targetId,
        userId: userId,
      };

    if (target.isPrivate) {
      createUserConnectionPayload.accepted = false;
    }

    await this.prisma.userConnection.create({
      data: createUserConnectionPayload,
    });

    const { title, body } = NotificationMessage.NEW_FOLLOWER;
    await this.notificationService.create({
      title,
      body,
      senderId: userId,
      receiverId: targetId,
      notificationType: 'NEW_FOLLOWER',
      objectId: userId,
    });

    return { success: true };
  }

  async find(
    findUserConnectionDto: FindUserConnectionDto,
  ): Promise<FindUserConnectionResponse> {
    const { userId, page, size, followType, query } = findUserConnectionDto;
    const skip = (page - 1) * size;

    const findUserCondtion: Prisma.UserConnectionWhereInput = {};
    const findConnectionInclude: Prisma.UserConnectionInclude = {};

    if (followType === 'FOLLOWING') {
      findUserCondtion.userId = userId;
      findConnectionInclude.following = {
        select: {
          id: true,
          fullName: true,
          nickname: true,
          avatarUrl: true,
        },
      };
    } else if (followType === 'FOLLOWER') {
      findUserCondtion.followUserId = userId;
      findConnectionInclude.follower = {
        select: {
          id: true,
          fullName: true,
          nickname: true,
          avatarUrl: true,
        },
      };
    }

    const [connections, count] = await Promise.all([
      this.prisma.userConnection.findMany({
        where: findUserCondtion,
        skip,
        take: size,
        include: findConnectionInclude,
      }),
      this.prisma.userConnection.count({ where: findUserCondtion }),
    ]);

    return {
      ...getDefaultPaginationReponse(findUserConnectionDto, count),
      data: connections,
    };
  }

  async getRelationship(userId: string, targetId: string) {
    const userConnectionWithTarget = await this.prisma.userConnection.findFirst(
      {
        where: {
          userId,
          followUserId: targetId,
        },
      },
    );

    const targetConnectionWithUser = await this.prisma.userConnection.findFirst(
      {
        where: {
          userId: targetId,
          followUserId: userId,
        },
      },
    );
    if (!targetConnectionWithUser && !userConnectionWithTarget) {
      return ConnectionStatus.NO_CONNECTION;
    }

    if (userConnectionWithTarget && targetConnectionWithUser) {
      return ConnectionStatus.FRIEND;
    }

    if (!userConnectionWithTarget && targetConnectionWithUser) {
      return ConnectionStatus.FOLLOWER;
    }

    if (userConnectionWithTarget && !targetConnectionWithUser) {
      return ConnectionStatus.FOLLOWING;
    }
  }

  async delete(userId: string, targetId: string) {
    await this.prisma.userConnection.delete({
      where: {
        userId_followUserId: {
          userId,
          followUserId: targetId
        }
      }
    })

    return {success: true}
  }
}
