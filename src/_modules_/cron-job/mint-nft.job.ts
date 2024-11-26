import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SerialCron } from 'src/decorators/serial-cron.decorator';
import { NFTCreationStatus } from '@prisma/client';
import { NftService } from '../nft/nft-ton.service';
import { NftMetadata } from 'src/helpers/ton-blockchain/nft.metadata';
import { NftSolanaService } from '../nft/nft-solana.service';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service';

// Mint nft when user check-in in event
@Injectable()
export class MintNFTCronJob {
  private readonly logger = new Logger(MintNFTCronJob.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly nftSalanaService: NftSolanaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  @SerialCron(`${process.env.CRON_JOB_MINT_NFT_EXPRESSION}`)
  async minNFT() {
    // use to store temporary nftItem id;
    let nftItemId;

    try {
      // get list nft with status PENDING or FAILED
      const listNftOffChain = await this.prismaService.nftItem.findMany({
        where: {
          OR: [
            {
              statusOnChain: NFTCreationStatus.PENDING,
            },
            {
              statusOnChain: NFTCreationStatus.FAILED,
            },
          ],
        },
        include: {
          nftCollection: {
            include: {
              event: true,
            },
          },
          user: true,
        },
      });

      for (let item of listNftOffChain) {
        nftItemId = item.id;

        if (!nftItemId) {
          throw new Error('Invalid nft item id in database');
        }

        const nftCollectionAddress = item.nftCollection.nftCollectionAddress;
        const collectionId = item?.nftCollection?.id;
        const name = item?.nftName;
        const description = item?.nftDescription;
        const image = item?.nftImage;
        const userSolanaAddress = item?.user.solanaAddress;
        const userId = item?.user.id;
        const telegramId = item?.user.telegramId;

        const nftCollection = await this.prismaService.nftCollection.findFirst({
          where: {
            eventId: item.nftCollection.event.id,
          },
        });

        const foundUser = await this.prismaService.user.findUnique({
          where: { id: userId },
        });

        if (!foundUser) {
          throw new NotFoundException('Not found user!');
        }

        if (!nftCollection) {
          throw new NotFoundException('NFT Collection Not Found');
        }

        if (!userId) {
          throw new Error('Invalid user to mint');
        }

        if(!telegramId) {
          throw new Error('Invalid telegram id'); 
        }

        // ignore mint nft on if user have not address
        if (!userSolanaAddress) {
          continue;
        }

        if (!nftCollectionAddress) {
          throw new Error('Invalid nft collection address');
        }

        // convert attributes into right form
        const attributes = Object.entries(item.nftAttributes).map(
          ([key, value]) => value,
        );

        const nftMetadata: NftMetadata = {
          name,
          description,
          image: image,
          attributes,
        };

        // deploy nft and upload metadata to ipfs
        const {transactionMintPublicKey,uri} = await this.nftSalanaService.mintAndTransferNFT(
          item.nftCollection.event.id,
          userId,
          nftMetadata,
          nftCollection,
          foundUser,
        );

        if (transactionMintPublicKey) {
          await this.prismaService.nftItem.update({
            where: {
              id: nftItemId,
            },
            data: {
              itemOwnerAddress: userSolanaAddress,
              itemIndex: nftCollection.nextItemIndex++,
              uri: uri,
              user: {
                connect: {
                  id: userId,
                },
              },
              nftCollection: {
                connect: {
                  id: collectionId,
                },
              },
              statusOnChain: NFTCreationStatus.SUCCESS,
              nftAddress: transactionMintPublicKey.toString(),
              error: null
            },
          });

          try {
            // Send notification user receive nft via Telegram bot
            await this.telegramBotService.sendMessage(
              +telegramId,
              `You have received a unique NFT attendance badge for joining ${name} event! Please log in the ConnectX application to check the tokens and NFT!`
            );
          } catch (error) {
            this.logger.error(error);
          }
      
        }
      }
      this.logger.log('[Cron-Job] Mint NFT');
    } catch (error) {
      // save error if failed
      if (nftItemId) {
         await this.prismaService.nftItem.update({
          where: {
            id: nftItemId,
          },
          data: {
            statusOnChain: NFTCreationStatus.FAILED,
            error: error.message,
          },
        });
      }
      this.logger.error(error);
    }
  }
}
