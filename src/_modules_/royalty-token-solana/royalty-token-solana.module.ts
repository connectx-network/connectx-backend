import { Module } from '@nestjs/common';
import { RoyaltySolanaTokenService } from './royalty-token-solana.service';
import { RoyaltySolanaTokenController } from './royalty-token-solana.controller';

@Module({
  controllers: [RoyaltySolanaTokenController],
  providers: [RoyaltySolanaTokenService],
  exports: [RoyaltySolanaTokenService]
})
export class RoyaltySolanaTokenModule {}
