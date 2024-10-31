import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CheckProofDto } from './dto/check-proof-dto';
import { TonApiService } from './ton-api-service';
import { TonProofService } from './ton-proof-service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthTonService {
  constructor(private readonly prisma: PrismaService) {}

  // check proof from crypto wallet
  async checkProof(telegramId: number, checkProodDto: CheckProofDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramId: `${telegramId}`,
      },
    });

    if (!user) {
      throw new NotFoundException('Not found user!');
    }

    const client = TonApiService.create(checkProodDto.network);
    const service = new TonProofService();

    const isValid = await service.checkProof(checkProodDto, (address) =>
      client.getWalletPublicKey(address),
    );
    if (!isValid) {
      throw new BadRequestException('Invalid proof');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        tonRawAddress: checkProodDto.address
      },
    });

    return updatedUser;
  }

  // Generate payload allow ton wallet sign in FE
  async generatePayload() {
    const service = new TonProofService();

    const payload = service.generatePayload();
    return { payload };
  }
}
