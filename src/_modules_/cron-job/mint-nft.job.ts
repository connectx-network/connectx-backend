import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SerialCron } from 'src/decorators/serial-cron.decorator';
import { NFTCreationStatus } from '@prisma/client';
import { NftService } from '../nft/nft-ton.service';
import { NftMetadata } from 'src/helpers/ton-blockchain/nft.metadata';


// Mint nft when user check-in in event
@Injectable()
export class MintNFTCronJob {
  private readonly logger = new Logger(MintNFTCronJob.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly nftService: NftService,
  ) {}

  @SerialCron(`${process.env.CRON_JOB_MINT_NFT_EXPRESSION}`)
  async minNFT() {
    // use to store temporary nftItem id;
    let nftItemId;

    try {
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
        const userRawAddress = item?.user.tonRawAddress;
        const userId = item?.user.id;

        if (!userId) {
          throw new Error('Invalid user to mint');
        }

        if (!userRawAddress) {
          // this.logger.log('Require user connect wallet');
          continue; 
        }

        if (!nftCollectionAddress) {
          throw new Error('Invalid nft collection address');
        }

        const attributes = Object.entries(item.nftAttributes).map(
          ([key, value]) => value,
        );
        const content_url = null;
        const content_type = null;

        const nftMetadata: NftMetadata = {
          name,
          description,
          image: image,
          attributes,
          content_url,
          content_type,
        };
     

        await this.nftService.createNftItem(
          item.nftCollection.event.id,
          userId,
          nftItemId,
          nftMetadata,
        );
      }
      this.logger.log('Mint NFT');
    } catch (error) {
      // save error if failed
      if (nftItemId) {
        await this.prismaService.nftItem.update({
          where: {
            id: nftItemId,
          },
          data: {
            statusOnChain: NFTCreationStatus.FAILED,
            error: JSON.stringify(error),
          },
        });
      }

      this.logger.error(error);
    }
  }
}
