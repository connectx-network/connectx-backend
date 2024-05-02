import { createHash } from 'crypto';
import { Address } from 'ton';

interface Domain {
  LengthBytes: number; // uint32 `json:"lengthBytes"`
  Value: string; // string `json:"value"`
}

interface ParsedMessage {
  Workchain: number; // int32
  Address: Buffer; // []byte
  Timstamp: number; // int64
  Domain: Domain; // Domain
  Signature: Buffer; // []byte
  Payload: string; // string
  StateInit: string; // string
}

interface Wallet {
  account: {
    address: string;
    walletStateInit: string;
  };
}

export function ConvertTonProofMessage(
  walletInfo: Wallet,
  tp: any,
): ParsedMessage {
  const address = Address.parse(walletInfo.account.address);

  const res: ParsedMessage = {
    Workchain: address.workChain,
    Address: address.hash,
    Domain: {
      LengthBytes: tp.proof.domain.lengthBytes,
      Value: tp.proof.domain.value,
    },
    Signature: Buffer.from(tp.proof.signature, 'base64'),
    Payload: tp.proof.payload,
    StateInit: walletInfo.account.walletStateInit,
    Timstamp: tp.proof.timestamp,
  };
  return res;
}

const tonProofPrefix = 'ton-proof-item-v2/';
const tonConnectPrefix = 'ton-connect';

export async function CreateMessage(message: ParsedMessage): Promise<Buffer> {
  // wc := make([]byte, 4)
  // binary.BigEndian.PutUint32(wc, uint32(message.Workchain))

  const wc = Buffer.alloc(4);
  wc.writeUint32BE(message.Workchain);

  // ts := make([]byte, 8)
  // binary.LittleEndian.PutUint64(ts, uint64(message.Timstamp))

  const ts = Buffer.alloc(8);
  ts.writeBigUint64LE(BigInt(message.Timstamp));

  // dl := make([]byte, 4)
  // binary.LittleEndian.PutUint32(dl, message.Domain.LengthBytes)
  const dl = Buffer.alloc(4);
  dl.writeUint32LE(message.Domain.LengthBytes);

  const m = Buffer.concat([
    Buffer.from(tonProofPrefix),
    wc,
    message.Address,
    dl,
    Buffer.from(message.Domain.Value),
    ts,
    Buffer.from(message.Payload),
  ]);

  // const messageHash =  //sha256.Sum256(m)
  // const messageHash = await crypto.subtle.digest('SHA-256', m)
  // const m = Buffer.from(tonProofPrefix)
  // m.write(ts)

  // m := []byte(tonProofPrefix)
  // m = append(m, wc...)
  // m = append(m, message.Address...)
  // m = append(m, dl...)
  // m = append(m, []byte(message.Domain.Value)...)
  // m = append(m, ts...)
  // m = append(m, []byte(message.Payload)...)

  const messageHash = createHash('sha256').update(m).digest();

  const fullMes = Buffer.concat([
    Buffer.from([0xff, 0xff]),
    Buffer.from(tonConnectPrefix),
    Buffer.from(messageHash),
  ]);
  // []byte{0xff, 0xff}
  // fullMes = append(fullMes, []byte(tonConnectPrefix)...)
  // fullMes = append(fullMes, messageHash[:]...)

  // const res = await crypto.subtle.digest('SHA-256', fullMes)
  const res = createHash('sha256').update(fullMes).digest();
  return Buffer.from(res);
}
