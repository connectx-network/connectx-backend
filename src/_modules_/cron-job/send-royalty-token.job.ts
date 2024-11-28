import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SerialCron } from 'src/decorators/serial-cron.decorator';
import { NFTCreationStatus, RoyaltyTokenStatus } from '@prisma/client';
import { RoyaltySolanaTokenService } from 'src/_modules_/royalty-token-solana/royalty-token-solana.service';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

// Send royalty token to user who join event
@Injectable()
export class SendRoyaltyTokenCronJob {
  private readonly logger = new Logger(SendRoyaltyTokenCronJob.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly royaltySolanaTokenService: RoyaltySolanaTokenService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  @SerialCron(`${process.env.CRON_JOB_MINT_NFT_EXPRESSION}`)
  async minNFT() {
    // use to store temporary nftItem id;
    let royalTokenSolanaItemId;
    
    try {
      // get list royalty token log  with status PENDING or FAILED
      const listRoyaltyToken =
        await this.prismaService.royaltySolanaTokenLog.findMany({
          where: {
            OR: [
              {
                statusOnChain: RoyaltyTokenStatus.PENDING,
              },
              {
                statusOnChain: RoyaltyTokenStatus.FAILED,
              },
            ],
          },
          include: {
            user: true,
          },
        });

      for (let item of listRoyaltyToken) {
        royalTokenSolanaItemId = item.id;
        const userId = item?.user.id;
        const telegramId = item?.user.telegramId;
        const userSolanaAddress = item?.user.solanaAddress;
        const amount = process.env.ROYALTY_TOKEN_AMOUNT;

        if (!royalTokenSolanaItemId) {
          throw new Error('Invalid royal item id in database');
        }

        // ignore mint nft on if user have not address
        if (!userSolanaAddress) {
          continue;
        }

        if (!Number(amount)) {
          throw new Error('Invalid royalty token amount');
        }

        if(!userId) {
          throw new Error('Invalid user id'); 
        }
        
        if(!telegramId) {
          throw new Error('Invalid telegram id'); 
        }

        // send royalty token to user who join event
        const tokenAccountAddress =
          await this.royaltySolanaTokenService.sendRoyaltyOnchain(
            userSolanaAddress,
            Number(amount)
          );
        
        // update royalty token solana log success
        if (tokenAccountAddress) {
          await this.royaltySolanaTokenService.updateSuccessRoyaltyToken(
            royalTokenSolanaItemId,
            userSolanaAddress,
            tokenAccountAddress,
            Number(amount),
          );

          try {
            // Send notification user receive nft via Telegram bot
            await this.telegramBotService.sendMessage(
              +telegramId,
              `You have received ${process.env.ROYALTY_TOKEN_AMOUNT} points for joining ${item.eventName} event! Please log in the ConnectX application to check the tokens!`
            );
          } catch (error) {
            this.logger.error(error);
          }
        }
      }
      this.logger.log('[Cron-Job] Send royalty token');

    } catch (error) {
      // save error if failed
      if (royalTokenSolanaItemId) {
        await this.royaltySolanaTokenService.updateFailedRoyaltyToken(
          royalTokenSolanaItemId,
          error,
        );
      }

      this.logger.error(error);
    }
  }
}
