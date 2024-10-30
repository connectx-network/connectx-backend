import {sha256} from "@ton/crypto";
import {Address, Cell, contractAddress, loadStateInit} from "@ton/ton";
import {Buffer} from "buffer";
import {randomBytes, sign} from "tweetnacl";
import { CheckProofDto } from "./dto/check-proof-dto";
import {tryParsePublicKey} from "src/helpers/wrappers/wallets-data";
import { instanceToPlain } from 'class-transformer';
const tonProofPrefix = 'ton-proof-item-v2/';
const tonConnectPrefix = 'ton-connect';

const validAuthTime = Number(process.env.VALID_SIGNED_TIME) ?? 120; 

export class TonProofService {

  /**
   * Generate a random payload.
   */
  public generatePayload(): string {
    return Buffer.from(randomBytes(32)).toString('hex');
  }

  /**
   * Reference implementation of the checkProof method:
   * https://github.com/ton-blockchain/ton-connect/blob/main/requests-responses.md#address-proof-signature-ton_proof
   */
  public async checkProof(payload: CheckProofDto, getWalletPublicKey: (address: string) => Promise<Buffer | null>): Promise<boolean> {
    try {
      let payloadConvert = instanceToPlain(payload);
      const stateInit = loadStateInit(Cell.fromBase64(payloadConvert.proof.state_init).beginParse());

      // 1. First, try to obtain public key via get_public_key get-method on smart contract deployed at Address.
      // 2. If the smart contract is not deployed yet, or the get-method is missing, you need:
      //  2.1. Parse TonAddressItemReply.walletStateInit and get public key from stateInit. You can compare the walletStateInit.code
      //  with the code of standard wallets contracts and parse the data according to the found wallet version.
      let publicKey = tryParsePublicKey(stateInit) ?? await getWalletPublicKey(payloadConvert.address);
      if (!publicKey) {
        return false;
      }
      // 2.2. Check that TonAddressItemReply.publicKey equals to obtained public key
      const wantedPublicKey = Buffer.from(payloadConvert.public_key, 'hex');
      if (!publicKey.equals(wantedPublicKey)) {
        return false;
      }


      // 2.3. Check that TonAddressItemReply.walletStateInit.hash() equals to TonAddressItemReply.address. .hash() means BoC hash.
      const wantedAddress = Address.parse(payloadConvert.address);
      const address = contractAddress(wantedAddress.workChain, stateInit);
      if (!address.equals(wantedAddress)) {
        return false;
      }

      // if (!allowedDomains.includes(payloadConvert.proof.domain.value)) {
      //   return false;
      // }

      const now = Math.floor(Date.now() / 1000);
      if (now - validAuthTime > payloadConvert.proof.timestamp) {
        return false;
      }

      const message = {
        workchain: address.workChain,
        address: address.hash,
        domain: {
          lengthBytes: payloadConvert.proof.domain.lengthBytes,
          value: payloadConvert.proof.domain.value,
        },
        signature: Buffer.from(payloadConvert.proof.signature, 'base64'),
        payload: payloadConvert.proof.payload,
        stateInit: payloadConvert.proof.state_init,
        timestamp: payloadConvert.proof.timestamp
      };

      const wc = Buffer.alloc(4);
      wc.writeUInt32BE(message.workchain, 0);

      const ts = Buffer.alloc(8);
      ts.writeBigUInt64LE(BigInt(message.timestamp), 0);

      const dl = Buffer.alloc(4);
      dl.writeUInt32LE(message.domain.lengthBytes, 0);

      // message = utf8_encode("ton-proof-item-v2/") ++
      //           Address ++
      //           AppDomain ++
      //           Timestamp ++
      //           payloadConvert
      const msg = Buffer.concat([
        Buffer.from(tonProofPrefix),
        wc,
        message.address,
        dl,
        Buffer.from(message.domain.value),
        ts,
        Buffer.from(message.payload),
      ]);

      const msgHash = Buffer.from(await sha256(msg));

      // signature = Ed25519Sign(privkey, sha256(0xffff ++ utf8_encode("ton-connect") ++ sha256(message)))
      const fullMsg = Buffer.concat([
        Buffer.from([0xff, 0xff]),
        Buffer.from(tonConnectPrefix),
        msgHash,
      ]);

      const result = Buffer.from(await sha256(fullMsg));

      return sign.detached.verify(result, message.signature, publicKey);
    } catch (e) {
      return false;
    }
  }

}
