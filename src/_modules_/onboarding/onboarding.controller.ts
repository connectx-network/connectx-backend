import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('onboarding')
@ApiTags('onboarding')
export class OnboardingController {
  @Get()
  async onboarding() {
    return 'success';
  }
}
