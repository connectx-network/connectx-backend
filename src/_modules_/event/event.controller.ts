import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventService } from './event.service';
import {
  AddFavoriteDto,
  BaseInteractEventDto,
  CheckInByAdminDto,
  CheckInByQrDto,
  CreateEventDto,
  CreateInvitationDto,
  DeleteEventDto,
  FindCreatedEventDto,
  FindEventDto,
  FindEventGuestDto,
  FindFeedDto,
  JoinEventDto,
  UpdateEventDto,
  UpdateGuestStatusDto,
  UpdateHighlightEventDto,
} from './event.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TelegramMiniAppGuard } from '../../guards/tma.guard';
import { TmaUser } from '../../decorators/tmaUser.decorator';

@Controller('event')
@ApiTags('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async create(
    @TmaUser('id') telegramId: number,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventService.create(telegramId, createEventDto);
  }

  @Get('/created')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async findCreated(
    @TmaUser('id') telegramId: number,
    @Query() findCreatedEventDto: FindCreatedEventDto,
  ) {
    return this.eventService.findCreated(`${telegramId}`, findCreatedEventDto);
  }

  @Get('/favorite')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async findFavorite(
    @TmaUser('id') telegramId: number,
    @Query() findCreatedEventDto: FindCreatedEventDto,
  ) {
    return this.eventService.findFavorite(`${telegramId}`, findCreatedEventDto);
  }

  @Get('/tma')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async findForTelegram(
    @TmaUser('id') telegramId: number,
    @Query() findEventDto: FindEventDto,
  ) {
    return this.eventService.findForTelegram(`${telegramId}`, findEventDto);
  }

  @Get('/tma/feeds')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async findFeed(
    @TmaUser('id') telegramId: number,
    @Query() findFeedDto: FindFeedDto,
  ) {
    return this.eventService.findFeedForTelegram(`${telegramId}`, findFeedDto);
  }

  @Get('tma/:shortId')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async findOneForTelegram(
    @TmaUser('id') telegramId: number,
    @Param('shortId') id: string,
  ) {
    return this.eventService.findOneForTelegram(`${telegramId}`, id);
  }

  @Get('/:shortId')
  async findOne(@Param('shortId') id: string) {
    return this.eventService.findOne(id);
  }

  @Get('/guest/:eventId')
  async findGuest(
    @Param('eventId') id: string,
    @Query() findEventGuestDto: FindEventGuestDto,
  ) {
    return this.eventService.findGuest(id, findEventGuestDto);
  }

  @Get()
  async find(@Query() findEventDto: FindEventDto) {
    return this.eventService.find(findEventDto);
  }

  @Patch('/highlight')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async updateHighlight(
    @TmaUser('id') telegramId: number,
    @Body() updateHighlightEventDto: UpdateHighlightEventDto,
  ) {
    return this.eventService.updateHighlight(
      telegramId,
      updateHighlightEventDto,
    );
  }

  @Post('/join')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async join(
    @TmaUser('id') telegramId: number,
    @Body() joinEventDto: JoinEventDto,
  ) {
    return this.eventService.join(`${telegramId}`, joinEventDto);
  }

  @Post('/favorite')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async addFavorite(
    @TmaUser('id') telegramId: number,
    @Body() addFavoriteDto: AddFavoriteDto,
  ) {
    return this.eventService.addFavorite(`${telegramId}`, addFavoriteDto);
  }

  @Put('/tma')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async update(
    @TmaUser('id') telegramId: number,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventService.update(`${telegramId}`, updateEventDto);
  }

  @Post('/invitation')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async invite(
    @TmaUser('id') telegramId: number,
    @Body() createInvitationDto: CreateInvitationDto,
  ) {
    return this.eventService.createInvitation(
      `${telegramId}`,
      createInvitationDto,
    );
  }

  @Put('/guest/status')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async updateInvitation(
    @TmaUser('id') telegramId: number,
    @Body() updateGuestStatusDto: UpdateGuestStatusDto,
  ) {
    return this.eventService.updateGuestStatus(
      `${telegramId}`,
      updateGuestStatusDto,
    );
  }

  @Patch('/guest/checkin')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async checkInByAdmin(
    @TmaUser('id') telegramId: number,
    @Body() checkInByAdminDto: CheckInByAdminDto,
  ) {
    return this.eventService.checkInByAdmin(`${telegramId}`, checkInByAdminDto);
  }

  @Post('/invitation/reject')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async rejectInvitation(
    @TmaUser('id') telegramId: number,
    @Body() rejectInvitationDto: BaseInteractEventDto,
  ) {
    return this.eventService.rejectInvitation(
      `${telegramId}`,
      rejectInvitationDto,
    );
  }

  @Delete('')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async delete(
    @TmaUser('id') telegramId: number,
    @Body() deleteEventDto: DeleteEventDto,
  ) {
    return this.eventService.delete(`${telegramId}`, deleteEventDto);
  }

  @Patch('/guest/checkin-qr')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async checkInGuestByQrCode(
    @TmaUser('id') telegramId: number,
    @Body() checkInByQr: CheckInByQrDto,
  ) {
    return this.eventService.checkInGuestByQrCode(`${telegramId}`, checkInByQr);
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
