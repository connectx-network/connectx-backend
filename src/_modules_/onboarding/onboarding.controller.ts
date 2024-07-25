import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TmaUser } from 'src/decorators/tmaUser.decorator';
import { TelegramMiniAppGuard } from 'src/guards/tma.guard';
import { OnboardingDto } from './onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@ApiTags('onboarding')
export class OnboardingController {
  constructor(private onboarding: OnboardingService) {}
  @Post()
  @UseGuards(TelegramMiniAppGuard)
  @ApiBearerAuth()
  async update(
    @TmaUser('id') telegramId: number,
    @Body() onboardingDto: OnboardingDto,
  ) {
    return this.onboarding.update(telegramId, onboardingDto);
  }
}
