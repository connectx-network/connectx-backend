import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoyaltySolanaTokenService } from './royalty-token-solana.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';


@Controller('royalty-solana-token')
@ApiTags('royalty-solana-token')
export class RoyaltySolanaTokenController {
  constructor(private readonly royaltyTokenService: RoyaltySolanaTokenService) {}

  @Get('/infor')
  @ApiOperation({summary: 'Return token information'})
  getTokenInfo() {
      return {
        name: 'ConnectX', 
        symbol: 'CTX', 
        logo: 'https://gateway.pinata.cloud/ipfs/QmVBjmWVczDnAJy2SF7AMX8SZDj9CbSiDdvCXQDJeiRpcc'
      }
  }
}
