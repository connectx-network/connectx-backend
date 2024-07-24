import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/types/auth.type';
import { CreateCityDto, FindCityDto, UpdateCityDto } from './city.dto';
import { CityService } from './city.service';

@ApiTags('city')
@Controller('city')
export class CityController {
  constructor(private city: CityService) {}

  @Get('/interested')
  @Roles(Role.ALL)
  async getInrerestedCity() {
    return this.city.findInterestedCity();
  }

  @Get()
  @Roles(Role.ADMIN)
  async find(@Query() findCityDto: FindCityDto) {
    return this.city.find(findCityDto);
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createCityDto: CreateCityDto) {
    return this.city.create(createCityDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: number, @Body() updateCityDto: UpdateCityDto) {
    return this.city.update(id, updateCityDto);
  }
}
