import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateEventDto,
  CreateEventInvitationDto,
  FindEventDto,
  FindEventResponse, FindJoinedEventUserDto
} from "./event.dto";
import { Event, Prisma } from "@prisma/client";
import { getDefaultPaginationReponse } from "../../utils/pagination.util";
import * as moment from "moment-timezone";
import { NotificationMessage } from "../../types/notification.type";
import { NotificationService } from "../notification/notification.service";

@Injectable()
export class EventService {
  private timezone = process.env.DEFAULT_TIMEZONE;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService
  ) {
  }

  async create(createEventDto: CreateEventDto) {
    const {
      eventCategoryId,
      eventDate,
      description,
      location,
      speakers,
      sponsors,
      tiketPrice,
      agenda,
      name,
      createEventAssetDto,
      createEventHostDto
    } = createEventDto;

    const createEventPayload: Prisma.EventUncheckedCreateInput = {
      eventCategoryId,
      eventDate,
      name
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
            type: item.type
          }))
        }
      };
    }

    if (createEventHostDto) {
      createEventPayload.eventHosts = {
        createMany: {
          data: createEventHostDto.map((item) => ({
            url: item.url,
            title: item.title
          }))
        }
      };
    }

    return this.prisma.event.create({
      data: createEventPayload
    });
  }

  async find(findEventDto: FindEventDto): Promise<FindEventResponse> {
    const { size, page, userId } = findEventDto;
    const skip = (page - 1) * size;

    const findEventCondition: Prisma.EventWhereInput = {};
    if (userId) {
      findEventCondition.joinedEventUsers = {
        some: {
          userId
        }
      };
    }

    const [events, count] = await Promise.all([
      this.prisma.event.findMany({
        where: findEventCondition,
        skip,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          eventAssets: true,
          eventHosts: true,
          eventLocationDetail: true
        },
        take: size
      }),
      this.prisma.event.count({ where: findEventCondition })
    ]);

    return {
      ...getDefaultPaginationReponse(findEventDto, count),
      data: events
    };
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        eventCategory: true,
        eventAssets: true,
        eventHosts: true,
        eventLocationDetail: true
      }
    });
  }

  async checkJoinedEvent(eventId: string, userId: string) {
    const joinedUser = await this.prisma.joinedEventUser.findFirst({
      where: {
        eventId,
        userId
      }
    });

    if (joinedUser) {
      return { joined: true };
    }

    return { joined: false };
  }

  async findJoinedEventUser(findJoinedEventUserDto: FindJoinedEventUserDto) {
    const { size, page, eventId, userId } = findJoinedEventUserDto;
    const skip = (page - 1) * size;

    const findJoinedUserCondition: Prisma.JoinedEventUserWhereInput = { eventId };

    const [joinedUsers, count] = await Promise.all([
      this.prisma.joinedEventUser.findMany({
        where: findJoinedUserCondition,
        skip,
        take: size,
        select: {
          user: {
            include: {
              followers: true,
              following: true
            }
          }
        }
      }),
      this.prisma.joinedEventUser.count({ where: findJoinedUserCondition })
    ]);
    let data = joinedUsers;
    if (userId) {
      data = joinedUsers.map(item => {
        const { user } = item;
        const { following } = user;
        const followingUser = following.find(u => u.userId === userId);
        const isFollowing = followingUser ? true : false;
        const newUser = { ...user, isFollowing };
        delete newUser.followers;
        delete newUser.following;
        return { ...item, user: newUser };
      });
    }

    return {
      ...getDefaultPaginationReponse(findJoinedEventUserDto, count),
      data: data
    };
  }

  async joinEvent(userId: string, eventId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new NotFoundException("Not found user!");
    }

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId
      }
    });

    if (!event) {
      throw new NotFoundException("Not found event!");
    }

    await this.prisma.joinedEventUser.create({
      data: {
        userId,
        eventId
      }
    });

    return { success: true };
  }

  async invite(
    userId: string,
    createEventInvitationDto: CreateEventInvitationDto
  ) {
    const { eventId, receiverId } = createEventInvitationDto;
    const sender = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!sender) {
      throw new NotFoundException("Not found sender!");
    }

    const currentDate = moment().tz(this.timezone).toDate();

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
        eventDate: {
          gte: currentDate
        }
      }
    });

    if (!event) {
      throw new NotFoundException("Not found event or event is ended!");
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      throw new NotFoundException("Not found receiver!");
    }

    const { title, body } = NotificationMessage.EVENT_INVITATION;
    await this.notificationService.create({
      title,
      body,
      senderId: userId,
      receiverId,
      notificationType: "EVENT_INVITATION",
      objectId: eventId
    });

    return { success: true };
  }

  async findEventUser(userId: string, eventId: string) {
    return this.prisma.joinedEventUser.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      },
      include: {
        user: true,
        event: true
      }
    });
  }

  async checkIn(userId: string, eventId: string) {
    const userEvent = await this.findEventUser(userId, eventId);
    if (userEvent.checkedIn) {
      throw new ConflictException("User has checked in this event!");
    }
    await this.prisma.joinedEventUser.update({
      where: { id: userEvent.id },
      data: {
        checkedIn: true
      }
    });
    return { success: true };
  }
}
