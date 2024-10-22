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

    return {
      ...getDefaultPaginationReponse(findEventFeedbackDto, count),
      data: feedbacks,
    };
  }
}
