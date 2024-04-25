import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  AcceptConnectionDto,
  ConnectionStatus,
  FindUserConnectionDto,
  FindUserConnectionResponse,
} from './user-connection.dto';
import { getDefaultPaginationReponse } from '../../utils/pagination.util';
import { NotificationMessage } from '../../types/notification.type';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UserConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, targetId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      throw new NotFoundException('Not found user!');
    }

    const createdUserConnections = await this.prisma.userConnection.findUnique({
      where: {
        userId_followUserId: {
          userId,
          followUserId: targetId,
        },
      },
    });

    if (createdUserConnections) {
      if (createdUserConnections.accepted) {
        throw new ConflictException('You are connected to this user!');
      } else {
        throw new ConflictException(
          'You requested connection to is this user!',
        );
      }
    }

    const createUserConnectionPayload: Prisma.UserConnectionUncheckedCreateInput =
      {
        accepted: false,
        followUserId: targetId,
        userId: userId,
      };

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
    const userConnectionWithTarget =
      await this.prisma.userConnection.findUnique({
        where: {
          userId_followUserId: {
            userId,
            followUserId: targetId,
          },
        },
      });
    if (userConnectionWithTarget.accepted) {
      return ConnectionStatus.CONNECTED;
    }
    return ConnectionStatus.NOT_CONNECTED;
  }

  async delete(userId: string, targetId: string) {
    const createdUserConnection = await this.prisma.userConnection.findUnique({
      where: {
        userId_followUserId: {
          userId,
          followUserId: targetId,
        },
      },
    });

    if (!createdUserConnection) {
      throw new NotFoundException('Not found connection!');
    }

    await this.prisma.userConnection.delete({
      where: {
        id: createdUserConnection.id,
      },
    });

    return { success: true };
  }

  async acceptConnection(userId: string, acceptConnectionDto: AcceptConnectionDto) {
    const { isAccepted, targetId } = acceptConnectionDto;
    const createdUserConnection = await this.prisma.userConnection.findUnique({
      where: {
        userId_followUserId: {
          userId: targetId,
          followUserId: userId,
        },
      },
    });

    if (!createdUserConnection) {
      throw new NotFoundException('Not found connection!');
    }

    await this.prisma.userConnection.update({
      where: {
        id: createdUserConnection.id,
      },
      data: {
        accepted: isAccepted,
      },
    });

    return { success: true };
  }
}
