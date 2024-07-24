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
        city: {
          connectOrCreate: {
            where: {
              country: onboardingDto.country,
              latitude: onboardingDto.latitude,
              longitude: onboardingDto.longitude,
              name: onboardingDto.name,
            },
            create: {
              country: onboardingDto.country,
              latitude: onboardingDto.latitude,
              longitude: onboardingDto.longitude,
              name: onboardingDto.name,
            },
          },
        },
      },
    });
    return { success: true };
  }
}
