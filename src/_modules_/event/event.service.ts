import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, FindEventDto, FindEventResponse } from './event.dto';
import { Event, Prisma } from '@prisma/client';
import { getDefaultPaginationReponse } from '../../utils/pagination.util';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

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
      createEventHostDto,
    } = createEventDto;

    const createEventPayload: Prisma.EventUncheckedCreateInput = {
      eventCategoryId,
      eventDate,
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

    const findEventCondition: Prisma.EventWhereInput = {};
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
          eventAssets: true,
          eventHosts: true,
        },
        take: size,
      }),
      this.prisma.event.count({where: findEventCondition}),
    ]);

    return {
      ...getDefaultPaginationReponse(findEventDto, count),
      data: events,
    };
  }

  async findOne(id: string): Promise<Event> {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        eventCategory: true,
        eventAssets: true,
        eventHosts: true,
      },
    });
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

    await this.prisma.joinedEventUser.create({
      data: {
        userId,
        eventId,
      },
    });

    return { success: true };
  }
}
