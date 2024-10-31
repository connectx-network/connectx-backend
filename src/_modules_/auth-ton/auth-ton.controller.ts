import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { AuthTonService } from './auth-ton.service';
import { CheckProofDto } from './dto/check-proof-dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TelegramMiniAppGuard } from 'src/guards/tma.guard';
import { TmaUser } from 'src/decorators/tmaUser.decorator';

@Controller('auth-ton')
@ApiTags('crypto-wallet')
export class AuthTonController {
  constructor(private readonly authTonService: AuthTonService) {}

  @Get('generate-payload')
  @ApiOperation({ summary: 'Generate payload to wallet sign' })
  generatePayload() {
    return this.authTonService.generatePayload();
  }

  @Patch('check-proof')
  @ApiOperation({ summary: 'Check proof and create tonRawAddress to user' })
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  checkProof(@TmaUser('id') telegramId: number, @Body() checkProofDto: CheckProofDto) {
    return this.authTonService.checkProof(telegramId, checkProofDto);
  }

}
