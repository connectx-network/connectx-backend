import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityDto, FindCityDto, UpdateCityDto } from './city.dto';

@Injectable()
export class CityService {
  constructor(private readonly prisma: PrismaService) {}

  async findInterestedCity() {
    {
      const cities = await this.prisma.city.findMany({
        where: {
          interested: true,
        },
      });
      return cities;
    }
  }
  async find({ page, size }: FindCityDto) {
    {
      const cities = await this.prisma.city.findMany({
        skip: size * (page - 1),
      });
      return cities;
    }
  }

  async create(createCityDto: CreateCityDto) {
    {
      const cityExist = await this.prisma.city.findUnique({
        where: { name: createCityDto.name },
      });

      if (cityExist) {
        throw new ConflictException('City has created!');
      }

      const city = await this.prisma.city.create({
        data: createCityDto,
      });
      return city;
    }
  }

  async update(cityId: number, createCityDto: UpdateCityDto) {
    {
      const city = await this.prisma.city.findUnique({
        where: { id: cityId },
      });

      if (!city) {
        throw new NotFoundException('Not found city!');
      }
      return this.prisma.city.update({
        where: { id: cityId },
        data: createCityDto,
      });
    }
  }
}
