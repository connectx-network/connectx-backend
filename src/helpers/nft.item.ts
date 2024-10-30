import { Address, internal, SendMode } from '@ton/core';
import { NftCollection } from './nft.collection';
import { TonClient } from '@ton/ton';
import { mintParams, OpenedWallet } from './nft';

export class NftItem {
  private collection: NftCollection;

  constructor(collection: NftCollection) {
    this.collection = collection;
  }

  public async deploy(
    wallet: OpenedWallet,
    params: mintParams,
  ): Promise<number> {
    const seqno = await wallet.contract.getSeqno();

    await wallet.contract.sendTransfer({
      seqno,
      secretKey: wallet.keyPair.secretKey,
      messages: [
        internal({
          value: '0.05',
          to: this.collection.address,
          body: this.collection.createMintBody(params),
        }),
      ],
      sendMode: SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
    });
    return seqno;
  }

  static async getAddressByIndex(
    collectionAddress: Address,
    itemIndex: number,
  ): Promise<Address> {
    const isMainNet = process.env.MAINNET ? true : false; 
    const endPointRpc = isMainNet ? process.env.MAINNET_RPC : process.env.TESTNET_RPC;

    const client = new TonClient({
      endpoint: endPointRpc,
      apiKey: process.env.TONCENTER_API_KEY,
    });
    const response = await client.runMethod(
      collectionAddress,
      'get_nft_address_by_index',
      [{ type: 'int', value: BigInt(itemIndex) }],
    );
    return response.stack.readAddress();
  }
}
