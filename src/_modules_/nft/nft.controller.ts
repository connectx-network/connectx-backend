import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { NftService } from './nft.service';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/types/auth.type';
import { CreateCollectionDto, CreateNftDto } from './nft.dto';

@Controller('nft')
@ApiTags('nft')
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Post('collection')
  @ApiBody({ type: CreateCollectionDto })
  async create(@Body() createCollectionDto: CreateCollectionDto) {
    return this.nftService.createCollection(createCollectionDto);
  }

  @Post('item')
  @ApiBody({ type: CreateNftDto })
  async createNft(@Body() createNftDto: CreateNftDto) {
    return this.nftService.createNftItem(
      createNftDto.collectionAddress,
      createNftDto.userAddress,
      createNftDto.nftMetadata,
    );
  }
}
