import {Injectable, NotFoundException} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {CreateCityDto, FindCityDto, UpdateCityHighlight} from './city.dto';
import { Prisma } from '@prisma/client';
import {getDefaultPaginationReponse} from "../../utils/pagination.util";

@Injectable()
export class CityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCityDto: CreateCityDto) {
    const { name, country, latitude, longitude } = createCityDto;

    return this.prisma.city.create({
      data: { name, country, latitude, longitude },
    });
  }

  async find(findCityDto: FindCityDto) {
    const { query, size, page, isHighlighted } = findCityDto;
    const skip = (page - 1) * size;
    const filter: Prisma.CityWhereInput = {};

    if (query) {
      filter.name = {
        contains: query,
        mode: 'insensitive',
      };
    }

    if (isHighlighted) {
      filter.isHighlighted = isHighlighted
    }

    const [cities, count] = await Promise.all([
      this.prisma.city.findMany({
        skip,
        take: size,
        where: filter,
      }),
      this.prisma.city.count({
        where: filter,
      }),
    ]);

    return {
      ...getDefaultPaginationReponse(findCityDto, count),
      data: cities
    }
  }

  async updateCityHighlight(updateCityHighlight: UpdateCityHighlight) {
    const {cityId, isHighlighted} = updateCityHighlight

    const city = await this.prisma.city.findUnique({
      where: {
        id: cityId,
      }
    })

    if (!city) {
      throw new NotFoundException('Not found city')
    }

    await this.prisma.city.update({
      where: {
        id: cityId,
      },
      data: {
        isHighlighted
      }
    })

    return {success: true}
  }
}
