import { ApiProperty } from '@nestjs/swagger';
import { NftAttributes } from 'src/types/nft.type';

export class CreateCollectionDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
}

export class CreateNftDto {
  @ApiProperty()
  collectionAddress: string;

  @ApiProperty()
  userAddress: string;

  @ApiProperty({
    type: 'object',
    properties: {
      name: { type: 'string', required: ['false'] },
      description: { type: 'string' },
      image: { type: 'string' },
      attributes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            trait_type: { type: 'string' },
            value: { type: 'string' },
          },
        },
      },
      lottie: { type: 'string' },
      content_url: { type: 'string' },
      content_type: { type: 'string', required: ['false'] },
    },
  })
  nftMetadata: {
    name: string;
    description: string;
    image?: string;
    attributes?: NftAttributes[];
    lottie?: string;
    content_url?: string;
    content_type?: string;
  };
}
