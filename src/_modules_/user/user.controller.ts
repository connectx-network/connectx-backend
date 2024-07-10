import {
  Body,
  Controller, Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ManualCreateUserDto,
  UpdateAvatarDto, UpdateSettingDto,
  UpdateUserDto,
} from './user.dto';
import { Roles } from '../../decorators/role.decorator';
import { Role } from '../../types/auth.type';
import { User } from '../../decorators/user.decorator';
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiTags} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SingleUploadDto } from '../file/file.dto';
import { UserTransformInterceptor } from '../../interceptors/user.interceptor';
import {TelegramMiniAppGuard} from "../../guards/tma.guard";
import {TmaUser} from "../../decorators/tmaUser.decorator";

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Post('/import-event')
  // @ApiBody({ type: ManualCreateUserDto })
  // async importEvent(@Body() manualCreateUserDto: ManualCreateUserDto) {
  //   return this.userService.manualCreate(manualCreateUserDto);
  // }

  @Put()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBody({ type: UpdateUserDto })
  @ApiBearerAuth()
  async update(
    @TmaUser('id') telegramId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(telegramId, updateUserDto);
  }

  @Patch('/avatar')
  @Roles(Role.ALL)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: UpdateAvatarDto })
  async updateAvatar(
    @TmaUser('id') telegramId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(telegramId, file);
  }

  @Get('/:id')
  @UseInterceptors(UserTransformInterceptor)
  async findOne(@Param('id') userId: string) {
    return this.userService.findOne(userId);
  }

  @Delete()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async delete(@TmaUser('id') telegramId: number) {
    return this.userService.delete(telegramId)
  }

  @Delete('/hard')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async hardDelete(@TmaUser('id') telegramId: number) {
    return this.userService.deleteHard(telegramId)
  }

  @Patch('/setting')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  @ApiBody({ type: UpdateSettingDto })
  async updateSetting(@TmaUser('id') telegramId: number, @Body() updateSettingDto : UpdateSettingDto) {
    return this.userService.updateSetting(telegramId, updateSettingDto)
  }
}
