import {
    collectionData,
    mintParams,
  } from 'src/helpers/nft';
  import {
    Address,
    Cell,
    beginCell,
  } from '@ton/core';
  
  export class NftCollectionWrapper {
    private nftCollectionAddress: string;

    public constructor(nftCollectionAddress: string) {
      this.nftCollectionAddress = nftCollectionAddress; 
    }
    public createMintBody(params: mintParams): Cell {
      const body = beginCell();
      body.storeUint(1, 32);
      body.storeUint(params.queryId || 0, 64);
      body.storeUint(params.itemIndex, 64);
      body.storeCoins(params.amount);
  
      const nftItemContent = beginCell();
      nftItemContent.storeAddress(params.itemOwnerAddress);
  
      const uriContent = beginCell();
      uriContent.storeBuffer(Buffer.from(params.commonContentUrl));
      nftItemContent.storeRef(uriContent.endCell());
  
      body.storeRef(nftItemContent.endCell());
      return body.endCell();
    }

    public get address(): string {
      return this.nftCollectionAddress; 
    }
  
  }
  