import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { AuthSolanaService } from './auth-solana.service';
import { CreateAuthSolanaDto } from './dto/payload-auth.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelegramMiniAppGuard } from 'src/guards/tma.guard';
import { GetMessageDto } from './dto/get-message.dto';
import { TmaUser } from 'src/decorators/tmaUser.decorator';

@Controller('auth-solana')
@ApiTags('auth-solana')
export class AuthSolanaController {
  constructor(private readonly authSolanaService: AuthSolanaService) {}

  @Patch('/verify-signature')
  @ApiOperation({summary: 'Verify signature'})
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async verifySignature(@Body()payload: CreateAuthSolanaDto,@TmaUser('id') telegramId: number) {
    return this.authSolanaService.verifySignature(payload,telegramId);
  }

  @Get('message/:address/:uuid')
  @ApiOperation({summary: 'Get message to sign'})
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  getMessage(@Param() getMessageDto: GetMessageDto, @TmaUser('id') telegramId: number) {
    return this.authSolanaService.getMessage(getMessageDto, telegramId);
  }

}
