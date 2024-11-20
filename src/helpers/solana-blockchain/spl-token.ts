import * as fs from 'fs';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import {
  Collection,
  TokenStandard,
  createAndMint,
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
  // PublicKey,
  Umi,
  Keypair,
  publicKey,
} from '@metaplex-foundation/umi';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { Logger } from '@nestjs/common';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import pkg from 'bs58';
import {
  Connection,
  PublicKey,
  Keypair as KeypairWeb3Solana,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
} from '@solana/spl-token';
import {
  ParsedAccountData,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';

export class SPLTokenMetaplex {
  public umi: Umi;
  public candyMachine: KeypairSigner;

  public keyPair: Keypair;
  public keypairWeb3Solana: KeypairWeb3Solana;
  private readonly logger = new Logger(SPLTokenMetaplex.name);
  public connection: Connection;

  constructor() {
    const hexPrivateKey = process.env.ADMIN_PRIVATE_KEY_SOLANA_ROYALTY_TOKEN; 
    if(!hexPrivateKey) {
      throw new Error('Invalid admin private key solana royalty token')
    }

    const { decode } = pkg;
    const decoded = decode(hexPrivateKey);

    const rpc = this.getRPC();
    this.umi = createUmi(rpc).use(mplCandyMachine());
    this.keyPair = this.umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(decoded),
    );

    this.umi.use(keypairIdentity(this.keyPair));

    this.connection = new Connection(
      `${rpc}`,
      'confirmed',
    );

    this.keypairWeb3Solana = KeypairWeb3Solana.fromSecretKey(
      new Uint8Array(decoded),
    );
  }

  // Use only one by script to create royalty token
  async createSPLToken() {
    const mint = generateSigner(this.umi);

    const metadata = {
      name: 'ConnectX',
      symbol: 'CXT',
      uri: 'https://gateway.pinata.cloud/ipfs/Qmd9eL9AmiCHkvkfgRoYCTC9eEXYqfWvRxppTueFhHopcA',
    };

    createAndMint(this.umi, {
      mint,
      authority: this.umi.identity,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      sellerFeeBasisPoints: percentAmount(0),
      decimals: 9,
      amount: 17446744073709551615,
      tokenOwner: this.umi.identity.publicKey,
      tokenStandard: TokenStandard.Fungible,
    })
      .sendAndConfirm(this.umi)
      .then(() => {
        console.log(
          'Successfully minted 1 million tokens (',
          mint.publicKey,
          ')',
        );
      })
      .catch((err) => {
        console.error('Error minting tokens:', err);
      });
  }

  private getRPC() {
    // MAINNET_SOLANA_RPC=https://api.mainnet-beta.solana.com
    // TESTNET_SOLANA_RPC=https://api.devnet.solana.com
    const rpc =
      Number(process.env.MAINNET) > 0
        ? process.env.MAINNET_SOLANA_RPC
        : process.env.TESTNET_SOLANA_RPC;
    return rpc;
  }

  async getSplTokenBalance(
    walletAddress: string, // Wallet address of the user
    tokenMintAddress: string, // Mint address of the SPL Token
  ): Promise<number> {
    try {
      // Convert addresses to PublicKey format
      const walletPubKey = new PublicKey(walletAddress);
      const tokenMintPubKey = new PublicKey(tokenMintAddress);

      // Find the associated token address
      const tokenAccountAddress = await getAssociatedTokenAddress(
        tokenMintPubKey,
        walletPubKey,
      );

      // Get token account info
      const tokenAccount = await getAccount(
        this.connection,
        tokenAccountAddress,
      );
      // Return the balance (divide by 10^decimals to get the human-readable balance)
      return Number(tokenAccount.amount);
    } catch (error) {
      this.logger.error('Error fetching token balance:', error);
      throw error;
    }
  }

  // send royalty token 
  async sendTokens(receiverAddress: string, amount: number) {
    try {
      if (!receiverAddress) {
        throw new Error('Invalid receiver address');
      }
  
      if (!Number(amount)) {
        throw new Error('Invalid amount transfer');
      }
  
      const DESTINATION_WALLET = receiverAddress;
      // const MINT_ADDRESS = 'DQuv8MW5mgQn5TXfrSj2ikUy9oqq2pXMPoaL7nHjy1Re';
      const MINT_ADDRESS = process.env.CONNECTX_ROYALTY_TOKEN_ADDRESS;
  
      if (!MINT_ADDRESS) {
        throw new Error('Invalid token address');
      }
  
      const TRANSFER_AMOUNT = amount;
  
      let sourceAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.keypairWeb3Solana,
        new PublicKey(MINT_ADDRESS),
        this.keypairWeb3Solana.publicKey,
      );
  
      //Getting Destination Token Account
      let destinationAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.keypairWeb3Solana,
        new PublicKey(MINT_ADDRESS),
        new PublicKey(DESTINATION_WALLET),
      );
  
      //Fetching Number of Decimals for Mint
      const numberDecimals = await this.getNumberDecimals(MINT_ADDRESS);
  
      // Creating and Sending Transaction
      const tx = new Transaction();
      tx.add(
        createTransferInstruction(
          sourceAccount.address,
          destinationAccount.address,
          this.keypairWeb3Solana.publicKey,
          TRANSFER_AMOUNT * Math.pow(10, numberDecimals),
        ),
      );
  
      const latestBlockHash =
        await this.connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = await latestBlockHash.blockhash;
      const signature = await sendAndConfirmTransaction(this.connection, tx, [
        this.keypairWeb3Solana,
      ]);
  
      console.log(
        '\x1b[32m', //Green Text
        `   Transaction Success!🎉`,
        `\n    https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      );
  
      return signature;
    } catch(error) {
        this.logger.error(error)
    }
  }

  async getNumberDecimals(mintAddress: string): Promise<number> {
    const info = await this.connection.getParsedAccountInfo(
      new PublicKey(mintAddress),
    );
    const result = (info.value?.data as ParsedAccountData).parsed.info
      .decimals as number;
    return result;
  }

  async testENV() {
    const MINT_ADDRESS = process.env.CONNECTX_ROYALTY_TOKEN_ADDRESS;
    console.log('MINT_ADDRESS: ', MINT_ADDRESS);
  }
  // async getSPLTokenInfor(tokenAddress: string) {
  //   try {
  //     const mintPubKey = new PublicKey(tokenAddress);

  //     // Fetch the metadata account address
  //     const metadataAddress = await Metadata.getPDA(mintPubKey);

  //     // Fetch metadata account information
  //     const metadataAccount = await Metadata.load(connection, metadataAddress);

  //     // Extract details from metadata
  //     const { data } = metadataAccount;
  //     const name = data.data.name; // Token name
  //     const symbol = data.data.symbol; // Token symbol
  //     const logoUri = data.data.uri; // Link to metadata JSON
  //     const decimals = (await connection.getTokenSupply(mintPubKey)).value.decimals;

  //     return { name, symbol, logoUri, decimals };
  //   } catch (error) {
  //     console.error('Error fetching token details:', error);
  //     throw error;
  //   }
  // }
}
