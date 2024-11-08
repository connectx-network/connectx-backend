import * as fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  create,
  mplCandyMachine,
  addConfigLines,
  mintV2,
  ConfigLineArgs,
} from '@metaplex-foundation/mpl-candy-machine';
import {
  TokenStandard,
  createNft,
  fetchDigitalAsset,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createSignerFromKeypair,
  dateTime,
  generateSigner,
  keypairIdentity,
  KeypairSigner,
  none,
  percentAmount,
  PublicKey,
  publicKey,
  sol,
  some,
  transactionBuilder,
  Umi,
} from '@metaplex-foundation/umi';
import { Logger } from '@nestjs/common';
import { createMintWithAssociatedToken, setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";

const hexPrivateKey =
  'yLgNYqUE41Yb7n2k1Fev1McFkVEjdUWwAivL1vD6MNQj8JxtDGtymbJ8MwbtGtjC1cwojGt9Ng91VduFFc7SHNR'; // replace with your actual hex private key
const privateKeyArray = Array.from(Buffer.from(hexPrivateKey, 'hex'));

export class NFTSolanaCollection {
  public umi: Umi;
  public candyMachine: KeypairSigner;
  public collectionMint: KeypairSigner;

  private readonly logger = new Logger(NFTSolanaCollection.name);

  constructor() {
    const rpc = this.getRPC();
    this.umi = createUmi(rpc).use(mplCandyMachine());
  }

  async createNftCollection(
    name: string,
    symbol: string,
    uri: string,
  ): Promise<PublicKey> {
    try {
      this.collectionMint = generateSigner(this.umi);
      await createNft(this.umi, {
        mint: this.collectionMint,
        authority: this.umi.identity,
        name: name,
        symbol: symbol,
        uri: uri,
        sellerFeeBasisPoints: percentAmount(0.0, 2),
        isCollection: true,
      }).sendAndConfirm(this.umi);

      return this.collectionMint.publicKey;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async createCandyMachine(
    collectionMint: PublicKey,
    symbol: string,
    name: string,
    prefixUri: string,
  ): Promise<PublicKey> {
    try {
      // Catch error if admin public key empty
      const adminPublicKey = `${process.env.ADMIN_PUBLIC_KEY_SOLANA}`;

      if (!adminPublicKey) {
        throw new Error('Invalid admin public key');
      }

      // create candey machine
      this.candyMachine = generateSigner(this.umi);

      const ix = await create(this.umi, {
        candyMachine: this.candyMachine,
        symbol: symbol,
        collectionMint: collectionMint,
        collectionUpdateAuthority: this.umi.identity,
        tokenStandard: TokenStandard.NonFungible,
        sellerFeeBasisPoints: percentAmount(0.0, 2),
        itemsAvailable: 10, // 2000 NFTs
        isMutable: false,
        creators: [
          {
            address: this.umi.identity.publicKey, // update the creator's address
            verified: true,
            percentageShare: 100,
          },
        ],
        configLineSettings: some({
          prefixName: `${name} #`,
          nameLength: 4,
          prefixUri: `${prefixUri}`,
          uriLength: 9,
          isSequential: false,
        }),
        hiddenSettings: none(),
        guards: {
          solPayment: some({
            lamports: sol(0), // 1 SOL / package
            destination: publicKey(`${process.env.ADMIN_PUBLIC_KEY_SOLANA}`), // update to the admin's wallet address
          }),
          //   startDate: some({ date: dateTime(`${new Date()}`) }), // update to the start date
          //   endDate: some({ date: dateTime(`${new Date().valueOf() + }`) }), // update to the end date
        },
      });

      await ix.sendAndConfirm(this.umi);

      console.log('candyMachine: ', this.candyMachine.publicKey);
      console.log('=> saved candy machine secret key to candy_machine.json');

      return this.candyMachine.publicKey;
    } catch (error) {
      this.logger.error(error);
    }
  }



  async addItemsToCandyMachine(candyMachine: PublicKey, index: number, uri: string) {
    try {
          // insert NFTs into candy machine
    const configLines: ConfigLineArgs[] = [];
  
    // update the number of items to be added
    configLines.push({ name: `${index}`, uri: `${uri}` });
    
    await addConfigLines(this.umi, {
      candyMachine: candyMachine,
      index: index,
      configLines,
    }).sendAndConfirm(this.umi);
  
    } catch(error) {
      this.logger.error(error);
    }
  }
  
  async  mintNft(collectionMint: PublicKey, candyMachine: PublicKey, owner: PublicKey) {
    try {
      const adminPublicKey = process.env.ADMIN_PUBLIC_KEY_SOLANA; 
      
      if(!adminPublicKey) {
        throw new Error('Invalid admin solana public key')
      }

      const collectionNft = await fetchDigitalAsset(this.umi, collectionMint);
  
      const nftMint = generateSigner(this.umi);
      await transactionBuilder()
        .add(setComputeUnitLimit(this.umi, { units: 800_000 }))
        .add(createMintWithAssociatedToken(this.umi, { mint: nftMint, owner: owner }))
        .add(
          mintV2(this.umi, {
            candyMachine: candyMachine,
            nftMint: nftMint,
            collectionMint: collectionNft.publicKey,
            collectionUpdateAuthority: collectionNft.metadata.updateAuthority,
            mintArgs: {
              solPayment: some({
                destination: publicKey(
                  adminPublicKey // update to the admin's wallet address
                ),
              }),
            },
          })
        )
        .sendAndConfirm(this.umi);
    
      console.log("minted an NFT: ", nftMint.publicKey);
    } catch(error) {
      this.logger.error(error);
    }
  }

  public async getCollectionPublicKey(): Promise<PublicKey> {
    return this.collectionMint.publicKey;
  }

  public async getCandyMachinePublicKey():Promise<PublicKey> {
    return this.candyMachine.publicKey;
  }

  private getRPC() {
    const rpc =
      Number(process.env.MAINNET) > 0
        ? process.env.MAINNET_SOLANA_RPC
        : process.env.TESTNET_SOLANA_RPC;
    return rpc;
  }
}
