import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query, UseGuards,
} from '@nestjs/common';
import { EventService } from './event.service';
import {
  CreateEventDto,
  CreateEventInvitationDto,
  FindEventDto,
  FindJoinedEventUserDto,
  FindOneEventDto,
  FindUserEventDto,
  ManualImportEventUserDto,
} from './event.dto';
import {ApiBearerAuth, ApiBody, ApiTags} from '@nestjs/swagger';
import { Roles } from '../../decorators/role.decorator';
import { Role } from '../../types/auth.type';
import { User } from '../../decorators/user.decorator';
import {TelegramMiniAppGuard} from "../../guards/tma.guard";
import {TmaUser} from "../../decorators/tmaUser.decorator";

@Controller('event')
@ApiTags('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async create(@TmaUser('id') telegramId: number, @Body() createEventDto: CreateEventDto) {
    return this.eventService.create(telegramId, createEventDto);
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Get()
  async find(@Query() findEventDto: FindEventDto) {
    return this.eventService.find(findEventDto);
  }

  // @Get('/joined-user')
  // async findJoinedUser(
  //   @Query() findJoinedEventUserDto: FindJoinedEventUserDto,
  // ) {
  //   return this.eventService.findJoinedEventUser(findJoinedEventUserDto);
  // }
  //
  // @Get('/user-event')
  // @Roles(Role.ADMIN)
  // async findUser(@Query() findUserEventDto: FindUserEventDto) {
  //   const { userId, eventId } = findUserEventDto;
  //   return this.eventService.findEventUser(userId, eventId);
  // }
  //
  //
  //
  // @Get('/check-join/:id')
  // @Roles(Role.ALL)
  // async checkJoinedEvent(
  //   @Param('id') eventId: string,
  //   @User('id') userId: string,
  // ) {
  //   return this.eventService.checkJoinedEvent(eventId, userId);
  // }
  //
  //
  //
  // @Post('/join/:id')
  // @Roles(Role.ALL)
  // async join(@Param('id') eventId: string, @User('id') userId: string) {
  //   return this.eventService.joinEvent(userId, eventId);
  // }
  //
  // @Post('/invite')
  // @Roles(Role.ALL)
  // async invite(
  //   @User('id') userId: string,
  //   @Body() createEventInvitationDto: CreateEventInvitationDto,
  // ) {
  //   return this.eventService.invite(userId, createEventInvitationDto);
  // }

  // @Post('/import-user')
  // @Roles(Role.ADMIN)
  // async importUserEvent(
  //   @Body() manualImportEventUserDto: ManualImportEventUserDto,
  // ) {
  //   return this.eventService.manualImportEventUser(manualImportEventUserDto);
  // }

  // @Patch('/check-in')
  // @Roles(Role.ADMIN)
  // async checkIn(@Body() findUserEventDto: FindUserEventDto) {
  //   const { userId, eventId } = findUserEventDto;
  //   return this.eventService.checkIn(userId, eventId);
  // }
}
