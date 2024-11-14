import * as fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  mplCandyMachine,
} from '@metaplex-foundation/mpl-candy-machine';
import {
  TokenStandard,
  createNft,
  fetchDigitalAsset,
  transferV1,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  KeypairSigner,
  percentAmount,
  PublicKey,
  Umi,
  Keypair,
} from '@metaplex-foundation/umi';
import { Logger } from '@nestjs/common';

import pkg from 'bs58';

export class NFTSolanaHelper {
  public umi: Umi;
  public candyMachine: KeypairSigner;

  public keyPair: Keypair;
  private readonly logger = new Logger(NFTSolanaHelper.name);

  constructor() {
    const hexPrivateKey = process.env.ADMIN_PRIVATE_KEY_SOLANA;
    const { decode } = pkg;
    const decoded = decode(hexPrivateKey);

    const rpc = this.getRPC();
    this.umi = createUmi(rpc).use(mplCandyMachine());
    this.keyPair = this.umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(decoded),
    );
    this.umi.use(keypairIdentity(this.keyPair));
  }

  // deploy nft collection onchain
  async createNftCollection(
    name: string,
    symbol: string,
    uri: string,
  ): Promise<PublicKey> {
    try {
      const collectionMint = generateSigner(this.umi);

      await createNft(this.umi, {
        mint: collectionMint,
        authority: this.umi.identity,
        name: name,
        symbol: symbol,
        uri: uri,
        sellerFeeBasisPoints: percentAmount(0.0, 2),
        isCollection: true,
      }).sendAndConfirm(this.umi, { send: { commitment: 'finalized' } });

      return collectionMint.publicKey;
    } catch (error) {
      this.logger.error(error);
    }
  }

  // min nft collection onchain
  async mintNft(
    collectionMint: PublicKey,
    uri: string,
    name: string,
  ) {
    try {
      const nft = generateSigner(this.umi);
      const transaction = await createNft(this.umi, {
        mint: nft,
        name: name,
        symbol: name.slice(0,3),
        uri: uri,
        sellerFeeBasisPoints: percentAmount(0),
        collection: {
          key: collectionMint,
          verified: false,
        },
      });

      await transaction.sendAndConfirm(this.umi);
      const createdNft = await fetchDigitalAsset(this.umi, nft.publicKey);

      return createdNft.publicKey;
    } catch (error) {
      this.logger.error(error);
    }
  }

  // transfer nft collection onchain
  async transferNft(nftAddress: PublicKey, newOwner: PublicKey) {
    try {
      const signer = createSignerFromKeypair(this.umi, this.keyPair);

      const transactionTransfer =  await transferV1(this.umi, {
        mint: nftAddress,
        authority: signer,
        tokenOwner: signer.publicKey,
        destinationOwner: newOwner,
        tokenStandard: TokenStandard.NonFungible,
      }).sendAndConfirm(this.umi);

      return transactionTransfer.result; 
    } catch (error) {
      this.logger.error(error);
    }
  }

  private getRPC() {
    const rpc =
      Number(process.env.MAINNET) > 0
        ? process.env.MAINNET_SOLANA_RPC
        : process.env.TESTNET_SOLANA_RPC;
    return rpc;
  }
}
