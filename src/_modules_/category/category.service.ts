import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManyInterestDto } from './category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(createManyInterestDto: CreateManyInterestDto) {
    const { name } = createManyInterestDto;

    return this.prisma.category.createMany({
      data: name.map((item) => ({ name: item })),
    });
  }

  async find() {
    return this.prisma.category.findMany()
  }
}
