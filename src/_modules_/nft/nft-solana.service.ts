import {
    Injectable,
    InternalServerErrorException,
  } from '@nestjs/common';
  
  import { IpfsService } from '../ipfs/ipfs.service';
  import {
    createNftCollectionMetadata,
  } from 'src/helpers/ton-blockchain/nft.metadata';
  import { PrismaService } from '../prisma/prisma.service';
  import { v4 as uuidv4 } from 'uuid';
  import { CollectionCreationStatus } from '@prisma/client';
  import {NFTSolanaHelper} from "src/helpers/solana-blockchain/nft.ts";
  import {
    publicKey,
  } from "@metaplex-foundation/umi";

  export interface DeployCollection {
    name: string;
    description: string;
    image?: string;
    cover_image?: string;
    social_links?: string[];
  }
  
  @Injectable()
  export class NftSolanaService {
    constructor(
      private readonly ipfsService: IpfsService,
      private readonly prisma: PrismaService,
    ) {}
  
    //  save in database
    async createCollectionOffChain(
      eventId: string,
      { name, description, image, cover_image, social_links }: DeployCollection,
    ) {
      const adminWallet = await this.getAdminAddress();
  
      const collectionDt = {
        ownerAddress: adminWallet,
        royaltyPercent: 0,
        royaltyAddress: adminWallet,
        nextItemIndex: 0,
        commonContentUrl: '',
      };
  
      await this.prisma.nftCollection.create({
        data: {
          name: name,
          description: description,
          image: image,
          coverImage: cover_image || '',
          socialLinks: social_links || [],
          event: {
            connect: {
              id: eventId,
            },
          },
          ...collectionDt,
          ownerAddress: collectionDt.ownerAddress.toString(),
          royaltyAddress: collectionDt.royaltyAddress.toString(),
          statusOnChain: CollectionCreationStatus.PENDING,
        },
      });
    }
  
    // deploy nft collection onchain
    async deployCollection(
      eventId: string,
      collectionId: string,
      { name, description, image, cover_image, social_links }: DeployCollection,
    ) {
      const adminWallet = await this.getAdminAddress();
      const uuid = uuidv4();
      const collectionMetadata = createNftCollectionMetadata({
        name: name,
        description: description,
        image: image,
        cover_image,
        social_links,
        uuid,
      });
  
      try {
        const { IpfsHash } = await this.ipfsService.uploadJsonToIpfs(
          collectionMetadata,
          { pinataMetadata: { name: name } },
        );

        const collectionDt = {
          ownerAddress: adminWallet,
          royaltyPercent: 0,
          royaltyAddress: adminWallet,
          nextItemIndex: 0,
          collectionContentUrl: `ipfs://${IpfsHash}`,
          commonContentUrl: '',
        };

        const collection = new NFTSolanaHelper();

        // create collection onchain
        const collectionPublicKey =await collection.createNftCollection(name,name, `https://gateway.pinata.cloud/ipfs/${IpfsHash}` )
        
        // create candy machine onchain
        const candyMachinePublickey =await collection.createCandyMachine(publicKey(`${collectionPublicKey}`), name, name, '')
  
        let newCollection;
        
        if (candyMachinePublickey) {
          newCollection = await this.prisma.nftCollection.update({
            where: {
              id: collectionId
            },
            data: {
              nftCollectionAddress: collectionPublicKey,
              candyMachinePublicKey: candyMachinePublickey,
              event: {
                connect: {
                  id: eventId,
                },
              },
              ...collectionDt,
              ownerAddress: collectionDt.ownerAddress.toString(),
              royaltyAddress: collectionDt.royaltyAddress.toString(),
              statusOnChain: CollectionCreationStatus.SUCCESS
            },
          });
        }
      } catch (error) {
        throw new InternalServerErrorException(
          error?.message || 'Internal Server Error: Deploy Collection Failed',
        );
      }
    }
  
    async deleteCollection(collectionId: string) {
      return this.prisma.nftCollection.delete({ where: { id: collectionId } });
    }
  
    // Private functions
    public async getAdminAddress(): Promise<string> {
      const adminSolanaPublicKey = process.env.ADMIN_PUBLIC_KEY_SOLANA; 
      if(!adminSolanaPublicKey.length) {
        throw new Error('Invalid public key admin in Solana')
      }
      return adminSolanaPublicKey;
    }
  
  }
  