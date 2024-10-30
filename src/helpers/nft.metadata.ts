import { NftAttributes } from '../types/nft.type';
import { Readable } from 'stream';
import fs from 'fs';

export type NftCollectionMetadata = {
  name: string;
  description: string;
  image?: string;
  cover_image?: string;
  social_links?: string[];
  uuid?: string
};

export type NftMetadata = {
  // event name 
  name: string;
  description: string;
  image?: string;
  attributes?: NftAttributes[];
  content_url?: string;
  content_type?: string;
};

function create<T>(metadata: T) {
  const filteredMetadata = filterNonNullFields(metadata);
  return filteredMetadata;
}

export const createNftCollectionMetadata = (
  metadata: NftCollectionMetadata,
) => {
  return create<NftCollectionMetadata>(metadata);
};

export const createNftMetadata = (metadata: NftMetadata) => {
  return create<NftMetadata>(metadata);
};

export class DataUrlStream extends Readable {
  private data: string;
  private offset: number;
  constructor(data: string) {
    super();
    this.data = data;
    this.offset = 0;
  }

  _read(size) {
    if (this.offset >= this.data.length) {
      // End of stream
      this.push(null);
      return;
    }

    const chunk = this.data.slice(this.offset, this.offset + size);
    this.offset += chunk.length;
    this.push(chunk);
  }
}

function filterNonNullFields(obj: { [key: string]: any }) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
