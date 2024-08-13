import {Body, Controller, Get, Post, Query} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CityService } from './city.service';
import {CreateCityDto, FindCityDto} from './city.dto';
import {Roles} from "../../decorators/role.decorator";
import {Role} from "../../types/auth.type";

@ApiTags('city')
@Controller('city')
export class CityController {
  constructor(private cityService: CityService) {}

  @Get()
  async find(@Query() findCityDto: FindCityDto) {
    return this.cityService.find(findCityDto);
  }

  @Post()
  async create(@Body() createCityDto: CreateCityDto) {
    return this.cityService.create(createCityDto);
  }
}
