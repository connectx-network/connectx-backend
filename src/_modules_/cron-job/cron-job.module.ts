import { Module } from '@nestjs/common';
import { MintNFTCronJob } from './mint-nft.job';
import { NftModule } from '../nft/nft.module';
import { CreateCollectionNFT } from './create-collection-nft.job';
import { PrismaModule } from 'src/_modules_/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [NftModule, PrismaModule, ScheduleModule.forRoot()],
  providers: [MintNFTCronJob, CreateCollectionNFT],
})
export class CronJobModule {}
