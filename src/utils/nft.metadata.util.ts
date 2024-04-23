import { NftAttributes } from 'src/types/nft.type';

export type NftCollectionMetadata = {
  name: string;
  description: string;
  image?: string;
  cover_image?: string;
  social_links?: string[];
};

export type NftMetadata = {
  name: string;
  description: string;
  image?: string;
  attributes?: NftAttributes[];
  lottie?: string;
  content_url?: string;
  content_type?: string;
};

function create<T>(metadata: T) {
  const filteredMetadata = filterNonNullFields(metadata);
  return JSON.stringify(filteredMetadata);
}

export const createNftCollectionMetadata = (
  metadata: NftCollectionMetadata,
) => {
  return create<NftCollectionMetadata>(metadata);
};

export const createNftMetadata = (metadata: NftMetadata) => {
  return create<NftMetadata>(metadata);
};

function filterNonNullFields(obj: Object) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
