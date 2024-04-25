import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { NftAttributes } from 'src/types/nft.type';

export class DeployCollection {
  @ApiProperty()
  eventId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  @IsOptional()
  image?: string;

  @ApiProperty()
  @IsOptional()
  cover_image?: string;

  @ApiProperty()
  @IsOptional()
  social_links?: string[];
}

export class CreateNftDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({
    type: 'object',
    properties: {
      name: { type: 'string', required: ['false'] },
      description: { type: 'string' },
      image: { type: 'string' },
      attributes: {
        type: 'array',
        required: ['false'],
        items: {
          type: 'object',
          properties: {
            trait_type: { type: 'string' },
            value: { type: 'string' },
          },
          required: ['false'],
        },
      },
      lottie: { type: 'string', required: ['false'] },
      content_url: { type: 'string', required: ['false'] },
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
