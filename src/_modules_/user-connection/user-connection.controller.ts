import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query, UseGuards,
} from '@nestjs/common';
import { UserConnectionService } from './user-connection.service';
import { User } from '../../decorators/user.decorator';
import { Roles } from '../../decorators/role.decorator';
import { Role } from '../../types/auth.type';
import {
  AcceptConnectionDto,
  DeleteConnectionDto, FindListFollowDto,
  FindUserConnectionDto,
} from './user-connection.dto';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {TelegramMiniAppGuard} from "../../guards/tma.guard";
import {TmaUser} from "../../decorators/tmaUser.decorator";

@Controller('user-connection')
@ApiTags('user-connection')
export class UserConnectionController {
  constructor(private readonly userConnectionService: UserConnectionService) {}

  @Post('/accept')
  @Roles(Role.ALL)
  async accept(
    @User('id') userId: string,
    @Body() acceptConnectionDto: AcceptConnectionDto,
  ) {
    return this.userConnectionService.acceptConnection(
      userId,
      acceptConnectionDto,
    );
  }
  @Post('/:id')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async create(@TmaUser('id') telegramId: number, @Param('id') targetId: string) {
    return this.userConnectionService.create(telegramId, targetId);
  }

  @Get('/relation/:targetId')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async getRelationship(
    @Param('targetId') targetId: string,
    @TmaUser('id') telegramId: number
  ) {
    return this.userConnectionService.getRelationship(telegramId, targetId);
  }

  @Get()
  async find(@Query() findUserConnectionDto: FindUserConnectionDto) {
    return this.userConnectionService.find(findUserConnectionDto);
  }

  @Get('/following')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async getListFollowing(
      @TmaUser('id') telegramId: number,
      @Query() findListFollowDto: FindListFollowDto
  ) {
    return this.userConnectionService.findListFollowing(telegramId, findListFollowDto);
  }

  @Get('/follower')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async getListFollower(
      @TmaUser('id') telegramId: number,
      @Query() findListFollowDto: FindListFollowDto
  ) {
    return this.userConnectionService.findListFollower(telegramId, findListFollowDto);
  }

  @Get('/friend')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async getListFriend(
    @TmaUser('id') telegramId: number,
    @Query() findListFollowDto: FindListFollowDto
  ) {
    return this.userConnectionService.findListFriend(telegramId, findListFollowDto);
  }

  @Delete()
  @Roles(Role.ALL)
  async delete(
      @Body() deleteConnectionDto: DeleteConnectionDto,
      @User('id') userId: string,
  ) {
    const { targetId } = deleteConnectionDto;
    return this.userConnectionService.delete(userId, targetId);
  }
}
