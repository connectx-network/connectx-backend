import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto, FindEventDto } from './event.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../decorators/role.decorator';
import { Role } from '../../types/auth.type';

@Controller('event')
@ApiTags('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiBody({ type: CreateEventDto })
  async create(@Body() createEventDto: CreateEventDto) {
    return this.eventService.create(createEventDto);
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Get()
  async find(@Query() findEventDto: FindEventDto) {
    return this.eventService.find(findEventDto);
  }
}
