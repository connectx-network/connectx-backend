import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventCategoryDto } from './event-category.dto';

@Injectable()
export class EventCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventCategoryDto: CreateEventCategoryDto) {
    const { name } = createEventCategoryDto;
    return this.prisma.eventCategory.create({
      data: {
        name,
      },
    });
  }

  async find() {
    return this.prisma.eventCategory.findMany();
  }
}
