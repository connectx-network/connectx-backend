import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { NftService } from './nft.service';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/types/auth.type';
import { CreateCollectionDto } from './nft.dto';

@Controller("nft")
@ApiTags("nft")
export class NftController {

    constructor(private readonly nftService: NftService) { }

    @Post('collection')
    @ApiBody({ type: CreateCollectionDto })
    async create (@Body() createCollectionDto: CreateCollectionDto) {
        return this.nftService.createCollection(createCollectionDto)
    }

}
