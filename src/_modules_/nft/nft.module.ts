import { Module } from '@nestjs/common';
import { NftController } from './nft.controller';
import { NftService } from './nft.service';
import { UserModule } from '../user/user.module';
import { IpfsService } from '../ipfs/ipfs.service';

@Module({
  imports: [UserModule],
  controllers: [NftController],
  providers: [NftService, IpfsService],
})
export class NftModule {}
