import { Module } from '@nestjs/common';
import { MintNFTCronJob } from './mint-nft.job';
import { NftModule } from '../nft/nft.module';
import { CreateCollectionNFT } from './create-collection-nft.job';

@Module({
  imports: [NftModule],
  providers: [MintNFTCronJob,CreateCollectionNFT],
})
export class CronJobModule {}
