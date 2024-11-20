import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put, Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../decorators/role.decorator';
import { TmaUser } from '../../decorators/tmaUser.decorator';
import { TelegramMiniAppGuard } from '../../guards/tma.guard';
import { UserTransformInterceptor } from '../../interceptors/user.interceptor';
import { Role } from '../../types/auth.type';
import { FindUserDto, GetUserNFTDto, GetUserNFTsDto, UpdateAvatarDto, UpdateSettingDto, UpdateUserDto } from './user.dto';
import { UserService } from './user.service';

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
  @UseGuards(TelegramMiniAppGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: UpdateAvatarDto })
  @ApiBearerAuth()
  async updateAvatar(
    @TmaUser('id') telegramId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(telegramId, file);
  }

  @Get('/tma')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async findForTelegram(@TmaUser('id') telegramId: number, @Query() findUserDto: FindUserDto) {
    return this.userService.findForTelegram(`${telegramId}`, findUserDto);
  }

  @Get('/list-nft')
  @ApiOperation({summary: 'Get list nft belong user'})
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async getUserNfts(@TmaUser('id') telegramId: number, @Query() getUserNFTsDto: GetUserNFTsDto) {
    return this.userService.getUserNfts(telegramId,getUserNFTsDto );
  }

  @Get('/nft/:nftAddress')
  @ApiOperation({summary: 'Get nft belong user'})
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async getUserNft(@TmaUser('id') telegramId: number, @Query() nftAddress: GetUserNFTDto) {
    return this.userService.getUserNft(telegramId, nftAddress);
  }


  @Get('/solana/royalty-token-balance')
  @ApiOperation({summary: 'Get user royalty token balance solana'})
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async getRoyalTokenBalanceSolana(@TmaUser('id') telegramId: number) {
    return this.userService.getRoyalTokenBalanceSolana(telegramId);
  }

  @Get('/:id')
  @UseInterceptors(UserTransformInterceptor)
  async findOne(@Param('id') userId: string) {
    return this.userService.findOne(userId);
  }

  @Get('/tma/:id')
  @UseInterceptors(UserTransformInterceptor)
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async findOneForTelegram(@TmaUser('id') telegramId: number,@Param('id') userId: string) {
    return this.userService.findOneForTelegram(`${telegramId}`, userId);
  }

  @Delete()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async delete(@TmaUser('id') telegramId: number) {
    return this.userService.delete(telegramId);
  }

  @Delete('/hard')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async hardDelete(@TmaUser('id') telegramId: number) {
    return this.userService.deleteHard(telegramId);
  }

  @Patch('/setting')
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  @ApiBody({ type: UpdateSettingDto })
  async updateSetting(
    @TmaUser('id') telegramId: number,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.userService.updateSetting(telegramId, updateSettingDto);
  }
}
