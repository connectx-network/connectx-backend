import {
  ConflictException,
  Injectable, NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  AcceptConnectionDto,
  ConnectionStatus, FindListFollowDto,
  FindUserConnectionDto,
  FindUserConnectionResponse,
} from './user-connection.dto';
import { getDefaultPaginationReponse } from '../../utils/pagination.util';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UserConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(telegramId: number, targetId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      throw new NotFoundException('Not found user!');
    }

    if (!target.isPrivate) {
      throw new NotAcceptableException('This is private account!');
    }

    const createdUserConnections = await this.prisma.userConnection.findUnique({
      where: {
        userId_followUserId: {
          userId: user.id,
          followUserId: targetId,
        },
      },
    });

    if (createdUserConnections) {
      if (createdUserConnections.accepted) {
        await this.prisma.userConnection.delete({
          where: {
            id: createdUserConnections.id
          },
        });
        return {success: true}
      } else {
        throw new ConflictException(
          'You have sent follow request to is this user!',
        );
      }
    }

    const createUserConnectionPayload: Prisma.UserConnectionUncheckedCreateInput =
      {
        accepted: !target.isPrivate,
        followUserId: targetId,
        userId: user.id,
      };

    await this.prisma.userConnection.create({
      data: createUserConnectionPayload,
    });

    // const { title, body } = NotificationMessage.NEW_FOLLOWER;
    // await this.notificationService.create({
    //   title,
    //   body,
    //   senderId: user.id,
    //   receiverId: targetId,
    //   notificationType: 'NEW_FOLLOWER',
    //   objectId: user.id,
    // });

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

  async getRelationship(telegramId: number, targetId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    const [userToTarget, targetToUser] = await Promise.all([
      this.prisma.userConnection.findUnique({
        where: {
          userId_followUserId: {
            userId: user.id,
            followUserId: targetId,
          },
          accepted: true,
        },
      }),
      this.prisma.userConnection.findUnique({
        where: {
          userId_followUserId: {
            userId: targetId,
            followUserId: user.id,
          },
          accepted: true,
        },
      }),
    ]);

    if (userToTarget && targetToUser) {
      return ConnectionStatus.FRIEND;
    }

    if (userToTarget && !targetToUser) {
      return ConnectionStatus.FOLLOWING;
    }

    if (!userToTarget && targetToUser) {
      return ConnectionStatus.FOLLOWER;
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

  async acceptConnection(
    userId: string,
    acceptConnectionDto: AcceptConnectionDto,
  ) {
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

    if (isAccepted) {
      await this.prisma.userConnection.update({
        where: {
          id: createdUserConnection.id,
        },
        data: {
          accepted: isAccepted,
        },
      });
    } else {
      await this.prisma.userConnection.delete({
        where: {
          id: createdUserConnection.id,
        },
      });
    }

    return { success: true };
  }

  async findListFollowing(
    telegramId: number,
    findListFollowDto: FindListFollowDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const { size, page } = findListFollowDto;
    const skip = (page - 1) * size;

    const findListFollowingCondition: Prisma.UserWhereInput = {
      following: {
        some: {
          userId: user.id,
          accepted: true,
        },
      },
    };

    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: size,
        where: findListFollowingCondition,
        select: {
          id: true,
          telegramId: true,
          fullName: true,
          gender: true,
          company: true,
          jobTitle: true,
          following: true,
          avatarUrl: true,
        }
      }),
      this.prisma.user.count({
        where: findListFollowingCondition,
      }),
    ]);

    return {
      ...getDefaultPaginationReponse(findListFollowDto, count),
      data: users,
    };
  }

  async findListFollower(
      telegramId: number,
      findListFollowDto: FindListFollowDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const { size, page } = findListFollowDto;
    const skip = (page - 1) * size;

    const findListFollowingCondition: Prisma.UserWhereInput = {
      followers: {
        some: {
          userId: user.id,
          accepted: true,
        },
      },
    };

    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: size,
        where: findListFollowingCondition,
        select: {
          id: true,
          telegramId: true,
          fullName: true,
          gender: true,
          company: true,
          jobTitle: true,
          avatarUrl: true,
        }
      }),
      this.prisma.user.count({
        where: findListFollowingCondition,
      }),
    ]);

    return {
      ...getDefaultPaginationReponse(findListFollowDto, count),
      data: users,
    };
  }
}
