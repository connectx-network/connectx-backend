import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto } from './onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}
  async update(telegramId: number, onboardingDto: OnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });
    if (!user) {
      return new NotFoundException('Not found user!');
    }
    await this.prisma.user.update({
      where: {
        telegramId: `${telegramId}`,
      },
      data: {
      },
    });
    return { success: true };
  }
}
