import { Body, Controller, Get, Post } from '@nestjs/common';
import { EventCategoryService } from './event-category.service';
import { CreateEventCategoryDto } from './event-category.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../decorators/role.decorator';
import { Role } from '../../types/auth.type';

@Controller('event-category')
@ApiTags('event-category')
export class EventCategoryController {
  constructor(private readonly eventCategoryService: EventCategoryService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiBody({ type: CreateEventCategoryDto })
  async create(@Body() createEventCategoryDto: CreateEventCategoryDto) {
    return this.eventCategoryService.create(createEventCategoryDto);
  }

  @Get()
  async find() {
    return this.eventCategoryService.find();
  }
}
