import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';

import {
  collectionData,
  OpenedWallet,
  openWallet,
  waitSeqno,
} from 'src/helpers/nft';
import { IpfsService } from '../ipfs/ipfs.service';
import {
  createNftCollectionMetadata,
  createNftMetadata,
  DataUrlStream,
  NftMetadata,
} from 'src/helpers/ton-blockchain/nft.metadata';
import { PrismaService } from '../prisma/prisma.service';
import { NftCollection } from 'src/helpers/ton-blockchain/nft.collection';
import axios from 'axios';
import { Address, toNano } from '@ton/core';
import { NftItem } from 'src/helpers/ton-blockchain/nft.item';
import { QrCodeService } from '../qr-code/qr-code.service';
import { v4 as uuidv4 } from 'uuid';
import { NftCollectionWrapper } from 'src/helpers/ton-blockchain/nft.collection.wrapper';
import { CollectionCreationStatus, NFTCreationStatus } from '@prisma/client';

export interface DeployCollection {
  name: string;
  description: string;
  image?: string;
  cover_image?: string;
  social_links?: string[];
}

@Injectable()
export class NftService {
  constructor(
    private readonly ipfsService: IpfsService,
    private readonly prisma: PrismaService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  //  save in database
  async createCollection(
    eventId: string,
    { name, description, image, cover_image, social_links }: DeployCollection,
  ) {
    const adminWallet = await this.getAdminWallet();

    const collectionDt = {
      ownerAddress: adminWallet.contract.address,
      royaltyPercent: 0,
      royaltyAddress: adminWallet.contract.address,
      nextItemIndex: 0,
      // collectionContentUrl: `ipfs://${IpfsHash}`,
      commonContentUrl: '',
    };

    await this.prisma.nftCollection.create({
      data: {
        name: name,
        description: description,
        image: image,
        coverImage: cover_image || '',
        socialLinks: social_links || [],
        // nftCollectionAddress: collection.address.toString(),
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
    const adminWallet = await this.getAdminWallet();
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

      const collectionDt: collectionData = {
        ownerAddress: adminWallet.contract.address,
        royaltyPercent: 0,
        royaltyAddress: adminWallet.contract.address,
        nextItemIndex: 0,
        collectionContentUrl: `ipfs://${IpfsHash}`,
        commonContentUrl: '',
      };

      const collection = new NftCollection(collectionDt);
      const seqno = await collection.deploy(adminWallet);
      let isSuccess = await waitSeqno(seqno, adminWallet);

      let newCollection;
      
      if (isSuccess) {
        newCollection = await this.prisma.nftCollection.update({
          where: {
            id: collectionId
          },
          data: {
            nftCollectionAddress: collection.address.toString(),
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

  // create nft onchain + save in database
  async createNftItem(
    eventId: string,
    userId: string,
    nftItemId: string,
    {
      name,
      description,
      image,
      attributes,
      content_url,
      content_type,
    }: NftMetadata,
  ) {
    const adminWallet = await this.getAdminWallet();

    const nftCollection = await this.prisma.nftCollection.findFirst({
      where: {
        eventId: eventId,
      },
      select: {
        id: true,
        ownerAddress: true,
        royaltyPercent: true,
        royaltyAddress: true,
        nextItemIndex: true,
        collectionContentUrl: true,
        commonContentUrl: true,
        nftCollectionAddress: true,
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
    // Todo
    if (!foundUser.tonRawAddress) {
      throw new NotAcceptableException('User does not have ton address');
    }

    const {
      nftCollectionAddress,
      id: collectionId,
      ...nftCollectionData
    } = nftCollection;

    const collection = new NftCollectionWrapper(nftCollectionAddress);

    let listItems: any;
    let rpc = Number(process.env.MAINNET)
      ? process.env.TON_API_MAINNET_RPC
      : process.env.TON_API_TESTNET_RPC;

    try {
      listItems = await axios.get(
        `${rpc}/nfts/collections/${collection.address}/items`,
      );
    } catch (error) {
      throw new InternalServerErrorException("Can't get items from collection");
    }

    const itemIndex = listItems?.data?.nft_items?.length;

    const itemMetadata = createNftMetadata({
      name: `${name} #${itemIndex}`,
      description,
      image: image,
      attributes,
      content_url,
      content_type,
    });

    const { IpfsHash } = await this.ipfsService.uploadJsonToIpfs(itemMetadata, {
      pinataMetadata: { name: `${name} #${itemIndex}` },
    });

    if (!IpfsHash) {
      throw new Error('Invalid ipfs link');
    }

    const amount = `${process.env.VALUE_WHEN_CREATE_NFT}`;

    const mintParams = {
      queryId: itemIndex,
      itemOwnerAddress: Address.parseRaw(foundUser.tonRawAddress),
      itemIndex: itemIndex,
      amount: toNano(amount),
      commonContentUrl: `ipfs://${IpfsHash}`,
      uuid: uuidv4(),
    };

    const nftItem = new NftItem(collection);

    const seqno = await nftItem.deploy(adminWallet, mintParams);
    const isSuccess = await waitSeqno(seqno, adminWallet);

    const nftAddress = await nftItem.getAddressByIndex(
      Address.parse(nftCollectionAddress),
      itemIndex,
    );

    if (isSuccess) {
      await this.prisma.nftItem.update({
        where: {
          id: nftItemId,
        },
        data: {
          itemOwnerAddress: foundUser.tonRawAddress,
          queryId: mintParams.queryId,
          itemIndex: mintParams.itemIndex,
          amount: mintParams.amount.toString(),
          commonContentUrl: mintParams.commonContentUrl,
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
          nftAddress: nftAddress.toString(),
        },
      });
    }

    return {
      collectionAddress: collection.address.toString(),
      tokenId: itemIndex,
    };
  }

  async deleteCollection(collectionId: string) {
    return this.prisma.nftCollection.delete({ where: { id: collectionId } });
  }

  // Private functions
  public async getAdminWallet(): Promise<OpenedWallet> {
    const isMainNet = Number(process.env.MAINNET) ? true : false;
    const wallet = await openWallet(
      process.env.MNEMONIC!.split(' '),
      isMainNet,
    );
    return wallet;
  }

  // save in database
  async createNftItemOffChain(
    eventId: string,
    userId: string,
    {
      name,
      description,
      image,
      attributes,
      content_url,
      content_type,
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
}
