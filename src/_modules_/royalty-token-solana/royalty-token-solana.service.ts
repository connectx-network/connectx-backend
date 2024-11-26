import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoyaltyTokenDto } from './dto/create-royalty-token.dto';
import { UpdateRoyaltyTokenDto } from './dto/update-royalty-token.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Event, RoyaltyTokenStatus } from '@prisma/client';
import { SPLTokenMetaplex } from 'src/helpers/solana-blockchain/spl-token';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RoyaltySolanaTokenService {
  constructor(
    private readonly prisma: PrismaService,
  ) {
  }

  // send royalty token onchain by owner
  async sendRoyaltyOnchain(ownerAddress: string, amount: number) {
      const sPLTokenMetaplex = new SPLTokenMetaplex(); 
      return await sPLTokenMetaplex.sendTokens(ownerAddress, Number(amount))
  }

  async createRoyaltyLogTokenOffChain(event: Event,userId: string) {
    return await this.prisma.royaltySolanaTokenLog.create({
      data: {
        userId, 
        statusOnChain: RoyaltyTokenStatus.PENDING, 
        eventName: event?.title
      }
    })
  }

  async updateSuccessRoyaltyToken(id: string, ownerAddress: string, tokenAccountAddress: string, amount: number) {
    return await this.prisma.royaltySolanaTokenLog.update({
      where: {
        id
      }, 
      data: {
        ownerAddress,
        tokenAccountAddress, 
        amount: new Decimal(`${amount}`),
        statusOnChain: RoyaltyTokenStatus.SUCCESS, 
        error: null
      }
    })
  }

  async updateFailedRoyaltyToken(id: string, error: any) {
    return await this.prisma.royaltySolanaTokenLog.update({
      where: {
        id
      }, 
      data: {
        error: error, 
        statusOnChain: RoyaltyTokenStatus.FAILED, 
      }
    })
  }
}
