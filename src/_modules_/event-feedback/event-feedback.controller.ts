import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { EventFeedbackService } from './event-feedback.service';
import { CreateEventFeedbackDto, FindEventFeedbackDto } from './event-feedback.dto';
import { TelegramMiniAppGuard } from '../../guards/tma.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TmaUser } from '../../decorators/tmaUser.decorator';

@Controller('event-feedback')
@ApiTags('event-feedback')
export class EventFeedbackController {
  constructor(private readonly eventFeedbackService: EventFeedbackService) {
  }

  @Post()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async create(
    @TmaUser('id') telegramId: number,
    @Body() createEventFeedbackDto: CreateEventFeedbackDto,
  ) {
    return this.eventFeedbackService.create(
      `${telegramId}`,
      createEventFeedbackDto,
    );
  }

  @Get()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async find(@Query() findEventFeedbackDto: FindEventFeedbackDto) {
    return this.eventFeedbackService.find(findEventFeedbackDto);
  }
}
