import { Injectable } from '@nestjs/common';
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

    return this.prisma.event.create({
      data: createEventPayload,
    });
  }

  async find(findEventDto: FindEventDto): Promise<FindEventResponse> {
    const { size, page } = findEventDto;
    const skip = (page - 1) * size;

    const [events, count] = await Promise.all([
      this.prisma.event.findMany({
        skip,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.event.count(),
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
      },
    });
  }
}
