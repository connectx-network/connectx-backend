import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { QrCodeService } from '../qr-code/qr-code.service';

@Module({
  providers: [NftService, IpfsService,QrCodeService],
  exports:  [NftService, IpfsService,QrCodeService]
})
export class NftModule {}
