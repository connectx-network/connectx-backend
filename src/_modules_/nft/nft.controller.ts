import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { NftService } from './nft.service';
import { CreateNftDto, DeployCollection } from './nft.dto';

@Controller('nft')
@ApiTags('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post('collection')
  @ApiBody({ type: DeployCollection })
  async create(@Body() createCollectionDto: DeployCollection) {
    const { eventId, ...rest } = createCollectionDto;
    return this.nftService.deployCollection(eventId, rest);
  }

  @Post('mint/:eventId')
  @ApiBody({ type: CreateNftDto })
  async createNft(
    @Param('eventId') eventId: string,
    @Body() createNftDto: CreateNftDto,
  ) {
    const { userId, nftMetadata } = createNftDto;
    return this.nftService.createNftItem(eventId, userId, nftMetadata);
  }
}
