import { KeyPair, mnemonicToPrivateKey } from 'ton-crypto';
import {
  beginCell,
  Cell,
  OpenedContract,
  TonClient,
  WalletContractV3R2,
  WalletContractV4,
} from 'ton';

export type OpenedWallet = {
  contract: OpenedContract<WalletContractV4>;
  keypair: KeyPair;
};

export const openWallet = async (
  mnemonic: string[],
  testnet: boolean = true,
) => {
  const keypair = await mnemonicToPrivateKey(mnemonic);

  const toncenterBaseEndpoint: string = testnet
    ? 'https://testnet.toncenter.com'
    : 'https://toncenter.com';

  const client = new TonClient({
    endpoint: `${toncenterBaseEndpoint}/api/v2/jsonRPC`,
    apiKey: process.env.TONCENTER_API_KEY,
  });

  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keypair.publicKey,
  });

  const contract = client.open(wallet);

  return { contract, keypair };
};

export const waitSeqno = async (seqno: number, wallet: OpenedWallet) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(500);
    const seqnoAfter = await wallet.contract.getSeqno();
    if (seqnoAfter == seqno + 1) break;
  }
};

export const sleep = async (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const bufferToChunks = (buff: Buffer, chunkSize: number) => {
  const chunks: Buffer[] = [];
  while (buff.byteLength > 0) {
    chunks.push(buff.subarray(0, chunkSize));
    buff = buff.subarray(chunkSize);
  }
  return chunks;
};

const makeSnakeCell = (data: Buffer): Cell => {
  const chunks = bufferToChunks(data, 127);

  if (chunks.length === 0) return beginCell().endCell();

  if (chunks.length === 1) return beginCell().storeBuffer(chunks[0]).endCell();

  let currentCell = beginCell();

  for (let i = chunks.length - 1; i >= 0; i++) {
    const chunk = chunks[i];
    currentCell.storeBuffer(chunk);

    if (i - 1 >= 0) {
      const nextCell = beginCell();
      nextCell.storeRef(currentCell);
      currentCell = nextCell;
    }
  }

  return currentCell.endCell();
};

export const encodeOffChainContent = (content: string) => {
  let data = Buffer.from(content);

  const offChainPrefix = Buffer.from([0x01]);
  data = Buffer.concat([offChainPrefix, data]);
  return makeSnakeCell(data);
};
