import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { IpfsService } from '../ipfs/ipfs.service';
import {
  createNftCollectionMetadata,
  createNftMetadata,
  NftMetadata,
} from 'src/helpers/ton-blockchain/nft.metadata';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { BlockchainType, CollectionCreationStatus, NftCollection, NFTCreationStatus, User } from '@prisma/client';
import { NFTSolanaHelper } from 'src/helpers/solana-blockchain/nft';
import { publicKey } from '@metaplex-foundation/umi';

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
        blockchainType: BlockchainType.SOLANA,
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

      const uri =  `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;

      const collection = new NFTSolanaHelper();

      // create collection onchain
      const collectionPublicKey = await collection.createNftCollection(
        name,
        name.toString().slice(0, 3).trim(),
        uri,
      );

      return {collectionPublicKey, uri}; 
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal Server Error: Deploy Collection Failed',
      );
    }
  }

  // mint nft and transfer nft to user who join event
  async mintAndTransferNFT(
    eventId: string,
    userId: string,
    { name, description, image, attributes }: NftMetadata,
    nftCollection: NftCollection, 
    user: User
  ) {

    const nftName = `${name} #${nftCollection.currentNFTIndex}`;

    const itemMetadata = createNftMetadata({
      name: nftName,
      description,
      image: image,
      attributes,
    });

    const { IpfsHash } = await this.ipfsService.uploadJsonToIpfs(itemMetadata, {
      pinataMetadata: { name: nftName },
    });

    const uri = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;

    const collection = new NFTSolanaHelper();

    // mint nft
    const transactionMintPublicKey = await collection.mintNft(
      publicKey(nftCollection.nftCollectionAddress),
      uri,
      nftName,
    );

    if (!transactionMintPublicKey) {
      throw new Error('Error mint NFT');
    }

    // transfer nft
    const transferNFt = await collection.transferNft(
      transactionMintPublicKey,
      publicKey(user.solanaAddress),
    );

    if (!transferNFt) {
      throw new Error('Error tranfer NFT to owner');
    }

    return {transactionMintPublicKey,uri};
  }

  // create nft offchain
  async createNftItemOffChain(
    eventId: string,
    userId: string,
    {
      name,
      description,
      image,
      attributes,
    }: NftMetadata,
  ) {
    const nftCollection = await this.prisma.nftCollection.findFirst({
      where: {
        eventId: eventId,
      },
    });

    const foundUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!foundUser) {
      throw new NotFoundException('Not found user!');
    }

    if (!nftCollection) {
      throw new NotFoundException('NFT Collection Not Found');
    }

    const { id: collectionId } = nftCollection;

    return await this.prisma.nftItem.create({
      data: {
        itemOwnerAddress: foundUser.tonRawAddress,
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
        nftName: name,
        nftDescription: description,
        nftImage: image,
        nftAttributes: attributes,
        statusOnChain: NFTCreationStatus.PENDING,
      },
    });
  }

  async deleteCollection(collectionId: string) {
    return this.prisma.nftCollection.delete({ where: { id: collectionId } });
  }

  // Private functions
  public async getAdminAddress(): Promise<string> {
    const adminSolanaPublicKey = process.env.ADMIN_PUBLIC_KEY_SOLANA;
    if (!adminSolanaPublicKey.length) {
      throw new Error('Invalid public key admin in Solana');
    }
    return adminSolanaPublicKey;
  }
}
