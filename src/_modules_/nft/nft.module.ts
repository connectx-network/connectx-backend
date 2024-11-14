import { Module } from '@nestjs/common';
import { NftService } from './nft-ton.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { QrCodeService } from '../qr-code/qr-code.service';
import { NftSolanaService } from './nft-solana.service';

@Module({
  providers: [NftService, IpfsService,QrCodeService, NftSolanaService],
  exports:  [NftService, IpfsService,QrCodeService,NftSolanaService]
})
export class NftModule {}
