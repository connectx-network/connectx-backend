import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HostService } from './host.service';
import {
  AcceptOrRejectHostDto,
  AddHostRequestDto,
  DeleteHostDto,
  UpdateHostRequestDto,
} from './host.dto';
import { TmaUser } from 'src/decorators/tmaUser.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TelegramMiniAppGuard } from 'src/guards/tma.guard';

@Controller('event/hosts')
@ApiTags('event-hosts')
export class HostController {
  constructor(private readonly hostService: HostService) {}

  @Get('/list')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  getHosts(@Query('eventId') eventId: string) {
    return this.hostService.getHosts(eventId);
  }

  @Post()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  addHost(
    @TmaUser('id') telegramId: number,
    @Body() addHostRequestDto: AddHostRequestDto,
  ) {
    return this.hostService.addHost(telegramId, addHostRequestDto);
  }

  @Put()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  updateHost(
    @TmaUser('id') telegramId: number,
    @Body() updateHostRequestDto: UpdateHostRequestDto,
  ) {
    return this.hostService.updateHost(telegramId, updateHostRequestDto);
  }

  @Patch('confirm-to-be-host')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  acceptOrRejectHost(
    @TmaUser('id') telegramId: number,
    @Body() acceptOrRejectHostDto: AcceptOrRejectHostDto,
  ) {
    return this.hostService.acceptOrRejectHost(
      telegramId,
      acceptOrRejectHostDto,
    );
  }

  @Delete()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  deleteHost(
    @TmaUser('id') telegramId: number,
    @Body() deleteHostDto: DeleteHostDto,
  ) {
    return this.hostService.deleteHost(telegramId, deleteHostDto);
  }
}
