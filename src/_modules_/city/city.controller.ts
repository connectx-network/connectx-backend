import {Body, Controller, Get, Patch, Post, Query} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CityService } from './city.service';
import {CreateCityDto, FindCityDto, UpdateCityHighlight} from './city.dto';

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

  @Patch('highlight')
  async updateHighlight(@Body() updateCityHighlight: UpdateCityHighlight) {
    return this.cityService.updateCityHighlight(updateCityHighlight);
  }
}
