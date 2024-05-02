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
} from 'src/utils/nft.util';
import { IpfsService } from '../ipfs/ipfs.service';
import {
  createNftCollectionMetadata,
  createNftMetadata,
  DataUrlStream,
  NftMetadata,
} from 'src/utils/nft.metadata.util';
import { PrismaService } from '../prisma/prisma.service';
import { NftCollection } from './utils/NftCollection';
import axios from 'axios';
import { Address, toNano } from 'ton-core';
import { NftItem } from './utils/NftItem';
import { QrCodeService } from '../qr-code/qr-code.service';

interface DeployCollection {
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

  async deployCollection(
    eventId: string,
    { name, description, image, cover_image, social_links }: DeployCollection,
  ) {
    const adminWallet = await this.getAdminWallet();

    const collectionMetadata = createNftCollectionMetadata({
      name: name,
      description: description,
      image: image,
      cover_image,
      social_links,
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
      await waitSeqno(seqno, adminWallet);

      await this.prisma.nftCollection.create({
        data: {
          name: name,
          description: description,
          image: image,
          coverImage: cover_image || '',
          socialLinks: social_links || [],
          nftCollectionAddress: collection.address.toString(),
          event: {
            connect: {
              id: eventId,
            },
          },
          ...collectionDt,
          ownerAddress: collectionDt.ownerAddress.toString(),
          royaltyAddress: collectionDt.royaltyAddress.toString(),
        },
      });

      return {
        nftCollectionAddress: collection.address.toString(),
        success: true,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Internal Server Error: Deploy Collection Failed',
      );
    }
  }

  async createNftItem(
    eventId: string,
    userId: string,
    {
      name,
      description,
      image,
      attributes,
      lottie,
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

    if (!foundUser.tonAddress) {
      throw new NotAcceptableException('User does not have ton address');
    }

    const {
      nftCollectionAddress,
      id: collectionId,
      ...nftCollectionData
    } = nftCollection;

    const collection = new NftCollection({
      ...nftCollectionData,
      ownerAddress: adminWallet.contract.address,
      royaltyAddress: adminWallet.contract.address,
    });

    console.log(collection.address.toString(), nftCollectionAddress);

    let listItems: any;

    try {
      listItems = await axios.get(
        `https://testnet.tonapi.io/v2/nfts/collections/${collection.address}/items`,
      );
    } catch (error) {
      throw new InternalServerErrorException("Can't get items from collection");
    }

    const qrcode = await this.qrCodeService.generateQrCode(
      `${eventId};${userId}`,
    );

    const itemIndex = listItems?.data?.nft_items?.length;

    const itemMetadata = createNftMetadata({
      name: `${name} #${itemIndex}`,
      description,
      image: qrcode,
      attributes,
      lottie,
      content_url,
      content_type,
    });

    const { IpfsHash } = await this.ipfsService.uploadJsonToIpfs(itemMetadata, {
      pinataMetadata: { name: `${name} #${itemIndex}` },
    });

    const amount = '0.01';

    const mintParams = {
      queryId: itemIndex,
      itemOwnerAddress: Address.parseRaw(foundUser.tonAddress),
      itemIndex: itemIndex,
      amount: toNano(amount),
      commonContentUrl: `ipfs://${IpfsHash}`,
    };

    const nftItem = new NftItem(collection);

    const seqno = await nftItem.deploy(adminWallet, mintParams);

    await waitSeqno(seqno, adminWallet);

    await this.prisma.nftItem.create({
      data: {
        itemOwnerAddress: foundUser.tonAddress,
        queryId: mintParams.queryId,
        itemIndex: mintParams.itemIndex,
        amount: mintParams.amount.toString(),
        commonContentUrl: mintParams.commonContentUrl,
        nftCollection: {
          connect: {
            id: collectionId,
          },
        },
      },
    });

    return {
      collectionAddress: collection.address.toString(),
      tokenId: itemIndex,
      success: true,
    };
  }

  // Private functions
  private async getAdminWallet(): Promise<OpenedWallet> {
    const wallet = await openWallet(process.env.MNEMONIC!.split(' '), true);
    return wallet;
  }
}
