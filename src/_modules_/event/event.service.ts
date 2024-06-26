import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEventDto,
  CreateEventInvitationDto,
  FindEventDto,
  FindEventResponse,
  FindJoinedEventUserDto,
  ManualImportEventUserDto,
} from './event.dto';
import { Prisma } from '@prisma/client';
import { getDefaultPaginationReponse } from '../../utils/pagination.util';
import * as moment from 'moment-timezone';
import { NotificationMessage } from '../../types/notification.type';
import { NotificationService } from '../notification/notification.service';
import { QrCodeDto } from '../mail/mail.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { MailJob, Queues } from '../../types/queue.type';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EventService {
  private timezone = process.env.DEFAULT_TIMEZONE;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    @InjectQueue(Queues.mail) private readonly mailTaskQueue: Queue,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const {
      eventCategoryId,
      eventDate,
      description,
      location,
      speakers,
      sponsors,
      eventEndDate,
      tiketPrice,
      agenda,
      name,
      createEventAssetDto,
      createEventHostDto,
    } = createEventDto;

    const shortId = await this.generateUniqueCode();

    const createEventPayload: Prisma.EventUncheckedCreateInput = {
      eventCategoryId,
      eventDate,
      eventEndDate,
      shortId,
      name,
    };

    if (description) {
      createEventPayload.description = description;
    }
    if (location) {
      createEventPayload.location = location;
    }
    if (sponsors) {
      createEventPayload.sponsors = sponsors;
    }
    if (speakers) {
      createEventPayload.speakers = speakers;
    }
    if (tiketPrice) {
      createEventPayload.tiketPrice = tiketPrice;
    }
    if (agenda) {
      createEventPayload.agenda = agenda;
    }

    if (createEventAssetDto) {
      createEventPayload.eventAssets = {
        createMany: {
          data: createEventAssetDto.map((item) => ({
            url: item.url,
            type: item.type,
          })),
        },
      };
    }

    if (createEventHostDto) {
      createEventPayload.eventHosts = {
        createMany: {
          data: createEventHostDto.map((item) => ({
            url: item.url,
            title: item.title,
          })),
        },
      };
    }

    return this.prisma.event.create({
      data: createEventPayload,
    });
  }

  async find(findEventDto: FindEventDto): Promise<FindEventResponse> {
    const { size, page, userId } = findEventDto;
    const skip = (page - 1) * size;

    const findEventCondition: Prisma.EventWhereInput = { isDeleted: false };
    if (userId) {
      findEventCondition.joinedEventUsers = {
        some: {
          userId,
        },
      };
    }

    const [events, count] = await Promise.all([
      this.prisma.event.findMany({
        where: findEventCondition,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: true,
          eventAssets: {
            orderBy: {
              type: 'asc'
            }
          },
          eventHosts: true,
          eventLocationDetail: true,
          joinedEventUsers: {
            take: 3,
            orderBy: {
              joinDate: 'desc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  nickname: true,
                  avatarUrl: true,
                  // _count: true
                },
              },
            },
          },
        },
        take: size,
      }),
      this.prisma.event.count({ where: findEventCondition }),
    ]);

    return {
      ...getDefaultPaginationReponse(findEventDto, count),
      data: events,
    };
  }

  async findOne(shortId: string) {
    const event = await this.prisma.event.findUnique({
      where: { shortId },
      include: {
        _count: true,
        eventCategory: true,
        eventAssets: {
          orderBy: {
            type: 'asc'
          }
        },
        eventHosts: true,
        eventLocationDetail: true,
        eventPhases: {
          orderBy: {
            order: 'asc',
          },
        },
        joinedEventUsers: {
          take: 3,
          orderBy: {
            joinDate: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    return event;
  }

  async checkJoinedEvent(eventId: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        OR: [
          {
            id: eventId,
          },
          {
            shortId: eventId,
          },
        ],
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const joinedUser = await this.prisma.joinedEventUser.findFirst({
      where: {
        eventId: event.id,
        userId,
      },
    });

    if (joinedUser) {
      return { joined: true };
    }

    return { joined: false };
  }

  async findJoinedEventUser(findJoinedEventUserDto: FindJoinedEventUserDto) {
    const { size, page, eventId, userId } = findJoinedEventUserDto;
    const skip = (page - 1) * size;

    const findJoinedUserCondition: Prisma.JoinedEventUserWhereInput = {
      eventId,
    };

    const [joinedUsers, count] = await Promise.all([
      this.prisma.joinedEventUser.findMany({
        where: findJoinedUserCondition,
        skip,
        take: size,
        select: {
          userId: true,
          checkedIn: true,
          user: {
            include: {
              _count: true,
              followers: true,
              following: true,
            },
          },
        },
      }),
      this.prisma.joinedEventUser.count({ where: findJoinedUserCondition }),
    ]);
    let data = joinedUsers;
    if (userId) {
      data = joinedUsers.map((item) => {
        const { user } = item;
        const { following } = user;
        const followingUser = following.find((u) => u.userId === userId);
        const isFollowing = followingUser ? true : false;
        const newUser = { ...user, isFollowing };
        delete newUser.followers;
        delete newUser.following;
        return { ...item, user: newUser };
      });
    }

    return {
      ...getDefaultPaginationReponse(findJoinedEventUserDto, count),
      data: data,
    };
  }

  async joinEvent(userId: string, eventId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const joinedEventUser = await this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          eventId,
          userId,
        },
      },
    });

    if (joinedEventUser) {
      throw new NotFoundException('You have joined this event!');
    }

    await this.prisma.joinedEventUser.create({
      data: {
        userId,
        eventId,
      },
    });

    const payload: QrCodeDto = {
      eventId,
      eventName: event.name,
      userId,
      to: user.email,
      subject: `Ticket for ${event.name}`,
      fullName: user.fullName,
      fromDate: event.eventDate,
    };

    await this.mailTaskQueue.add(MailJob.sendQrMail, payload);

    return { success: true };
  }

  async invite(
    userId: string,
    createEventInvitationDto: CreateEventInvitationDto,
  ) {
    const { eventId, receiverId } = createEventInvitationDto;
    const sender = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!sender) {
      throw new NotFoundException('Not found sender!');
    }

    const currentDate = moment().tz(this.timezone).toDate();

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
        eventDate: {
          gte: currentDate,
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Not found event or event is ended!');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Not found receiver!');
    }

    const { title, body } = NotificationMessage.EVENT_INVITATION;
    await this.notificationService.create({
      title,
      body,
      senderId: userId,
      receiverId,
      notificationType: 'EVENT_INVITATION',
      objectId: eventId,
    });

    return { success: true };
  }

  async findEventUser(userId: string, eventId: string) {
    return this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        user: true,
        event: true,
      },
    });
  }

  async checkIn(userId: string, eventId: string) {
    const userEvent = await this.findEventUser(userId, eventId);
    if (userEvent.checkedIn) {
      throw new ConflictException('User has checked in this event!');
    }
    await this.prisma.joinedEventUser.update({
      where: { id: userEvent.id },
      data: {
        checkedIn: true,
      },
    });
    return { success: true };
  }

  private generateUniqueId(length: number = 6): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueId = '';
    for (let i = 0; i < length; i++) {
      uniqueId += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return uniqueId;
  }

  private async generateUniqueCode(): Promise<string> {
    let shortId: string;
    let isUnique = false;

    while (!isUnique) {
      shortId = this.generateUniqueId(6);
      const existingRecord = await this.prisma.event.findUnique({
        where: { shortId },
      });
      isUnique = !existingRecord;
    }

    return shortId;
  }

  async manualImportEventUser(
    manualImportEventUserDto: ManualImportEventUserDto,
  ) {
    const { eventId, emails } = manualImportEventUserDto;
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Not found event!');
    }

    const users = await this.userService.createMany(emails);
    const joinUsers = await Promise.all(
      users.map(async (user) => {
        const joinedUser = await this.prisma.joinedEventUser.findUnique({
          where: {
            userId_eventId: {
              userId: user.id,
              eventId,
            },
          },
          include: {
            user: true,
          },
        });

        if (joinedUser) {
          return;
        }

        return this.prisma.joinedEventUser.create({
          data: {
            userId: user.id,
            eventId,
          },
          include: {
            user: true,
          },
        });
      }),
    );

    const rawMailPayload: QrCodeDto[] = joinUsers.map((item) => {
      if (!item) {
        return;
      }
      const { user } = item;
      const { fullName, email } = user;
      return {
        eventId,
        subject: `Ticket for ${event.name}`,
        eventName: event.name,
        fullName,
        to: email,
        userId: user.id,
        fromDate: event.eventDate,
      };
    });

    const mailPayload = rawMailPayload.filter((item) => item);

    await this.mailTaskQueue.add(MailJob.sendQrImported, mailPayload);
    // await this.mailService.sendManyImportedUserEventMail(mailPayload);

    return { success: true };
  }
}
