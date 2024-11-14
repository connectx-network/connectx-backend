import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SerialCron } from 'src/decorators/serial-cron.decorator';
import { CollectionCreationStatus, NFTCreationStatus } from '@prisma/client';
import { NftSolanaService } from '../nft/nft-solana.service';


// Cron job to create collection in blockchain
@Injectable()
export class CreateCollectionNFT {
  private readonly logger = new Logger(CreateCollectionNFT.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly nftSolanaService: NftSolanaService,
  ) {}

  @SerialCron(`${process.env.CRON_JOB_CREATE_COLLECTION_EXPRESSION}`)
  async createCollectionNFT() {
    // use to store temporary event id;
    let eventId;

    try {
      // get all collection in db with status is PENDING or FAILED
      const listOffChainCollection = await this.prismaService.nftCollection.findMany({
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
          event: true
        }
      });

      for (let item of listOffChainCollection) {
        eventId = item?.event?.id; 
        const collectionId = item.id; 

        if(!collectionId){
          throw new Error('Invalid collection id in database')
        }

        if(!eventId){
          throw new Error('Invalid event id in database')
        }
        const name = item?.name;
        const description = item?.description;
        const cover_image = item?.coverImage;
        const social_links = item?.socialLinks;
        const image = item?.image; 
        const collectionMetadata = { name, description, image, cover_image, social_links }; 

        // deploy collection in blockhain and update metadata to ipfs
        let {collectionPublicKey,uri} = await this.nftSolanaService.deployCollection(eventId, collectionId, collectionMetadata); 
        
        let newCollection;
        const adminWallet = await this.nftSolanaService.getAdminAddress(); 

        // update nft collection in database if successfully deploy
        if (collectionPublicKey) {
          const collectionDt = {
            ownerAddress: adminWallet,
            royaltyPercent: 0,
            royaltyAddress: adminWallet,
            nextItemIndex: 0,
            collectionContentUrl: uri,
            commonContentUrl: '',
          };

          newCollection = await this.prismaService.nftCollection.update({
            where: {
              id: collectionId,
            },
            data: {
              nftCollectionAddress: collectionPublicKey,
              event: {
                connect: {
                  id: eventId,
                },
              },
              ...collectionDt,
              ownerAddress: collectionDt.ownerAddress.toString(),
              royaltyAddress: collectionDt.royaltyAddress.toString(),
              statusOnChain: CollectionCreationStatus.SUCCESS,
              error: null,
            },
          });
        }
      }

      this.logger.log('[Cron-Job] Create collection NFT');

    } catch (error) {
      // save error if failed
      if (eventId) {
        await this.prismaService.nftCollection.update({
          where: {
            id: eventId,
          },
          data: {
            statusOnChain: NFTCreationStatus.FAILED,
            error: JSON.stringify(error)
          },
        });
      }

      this.logger.error(error);
    }
  }
}
