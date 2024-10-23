import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventFeedbackDto, FindEventFeedbackDto } from './event-feedback.dto';
import { Prisma } from '@prisma/client';
import { getDefaultPaginationReponse } from '../../utils/pagination.util';

@Injectable()
export class EventFeedbackService {
  constructor(private readonly prisma: PrismaService) {
  }

  async create(telegramId: string, createEventDto: CreateEventFeedbackDto) {
    const { rate, content, eventId } = createEventDto;
    const user = await this.prisma.user.findUnique({
      where: {
        telegramId,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user');
    }

    await this.prisma.eventFeedback.create({
      data: {
        rate,
        content,
        eventId,
        userId: user.id,
      },
    });

    return { success: true };
  }

  async find(findEventFeedbackDto: FindEventFeedbackDto) {
    const { page, size, eventId } = findEventFeedbackDto;
    const skip = (page - 1) * size;

    const filter: Prisma.EventFeedbackWhereInput = {
      isDelete: false,
      eventId,
    };
    const [feedbacks, count] = await Promise.all([
      this.prisma.eventFeedback.findMany({
        take: size,
        skip,
        where: filter,
        orderBy: {
          createdDate: 'desc',
        },
        include: {
          user: true,
        },
      }),
      this.prisma.eventFeedback.count({
        where: filter,
      }),
    ]);

    const statistic = await this.findStatistic(eventId);

    return {
      ...getDefaultPaginationReponse(findEventFeedbackDto, count),
      statistic,
      data: feedbacks,
    };
  }

  async findStatistic(eventId: string) {
    const query = `
      SELECT 
        (
          SELECT COUNT(id)::int
          FROM public.event_feedback
          WHERE rate = 1 AND event_id = '${eventId}'
        ) as "1",
        (
          SELECT COUNT(id)::int
          FROM public.event_feedback
          WHERE rate = 2 AND event_id = '${eventId}'
        ) as "2",
        (
          SELECT COUNT(id)::int
          FROM public.event_feedback
          WHERE rate = 3 AND event_id = '${eventId}'
        ) as "3",
        (
          SELECT COUNT(id)::int
          FROM public.event_feedback
          WHERE rate = 4 AND event_id = '${eventId}'
        ) as "4",
        (
          SELECT COUNT(id)::int
          FROM public.event_feedback
          WHERE rate = 5 AND event_id = '${eventId}'
        ) as "5",
        (
          SELECT SUM(rate) / COUNT(id)::float    as average_rate
          FROM public.event_feedback
          WHERE event_id = '${eventId}'
        )
    `;
    return this.prisma.$queryRawUnsafe(query);
  }
}
