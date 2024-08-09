import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/types/auth.type';
import {
  CreateCityDto,
  FindCityDto,
  FindInterestedCityDto,
  UpdateCityDto,
} from './city.dto';
import { CityService } from './city.service';
import { TelegramMiniAppGuard } from 'src/guards/tma.guard';

@ApiTags('city')
@Controller('city')
export class CityController {
  constructor(private city: CityService) {}

  // @Get('/interested')
  // @UseGuards(TelegramMiniAppGuard)
  // @ApiBearerAuth()
  // async getInrerestedCity(@Query() findInterestedDto: FindInterestedCityDto) {
  //   return this.city.findInterestedCity(findInterestedDto);
  // }
  //
  // @Get()
  // async find(@Query() findCityDto: FindCityDto) {
  //   return this.city.find(findCityDto);
  // }
  //
  // @Post()
  // async create(@Body() createCityDto: CreateCityDto) {
  //   return this.city.create(createCityDto);
  // }
  //
  // @Patch(':id')
  // @UseGuards(TelegramMiniAppGuard)
  // async update(@Param('id') id: number, @Body() updateCityDto: UpdateCityDto) {
  //   return this.city.update(id, updateCityDto);
  // }
}
