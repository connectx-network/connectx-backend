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
  FindEventDto, JoinEventDto, UpdateHighlightEventDto,
} from './event.dto';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
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

  @Get('/:shortId')
  async findOne(@Param('shortId') id: string) {
    return this.eventService.findOne(id);
  }

  @Get()
  async find(@Query() findEventDto: FindEventDto) {
    return this.eventService.find(findEventDto);
  }

  @Patch('/highlight')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async updateHighlight(@TmaUser('id') telegramId: number, @Body() updateHighlightEventDto: UpdateHighlightEventDto) {
    return this.eventService.updateHighlight(telegramId, updateHighlightEventDto);
  }

  @Post('/join')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async join(@TmaUser('id') telegramId: number, @Body() joinEventDto: JoinEventDto) {
    return this.eventService.join(`${telegramId}`, joinEventDto);
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
