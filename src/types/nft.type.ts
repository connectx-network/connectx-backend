import { Address } from "ton-core";

export type CollectionData = {
    ownerAddress: Address;
    royaltyPercent: number;
    royaltyAddress: Address;
    nextItemIndex: number;
    collectionContentUrl: string;
    commonContentUrl: string;
}

export type MintParams = {
    queryId: number | null,
    itemOwnerAddress: Address,
    itemIndex: number,
    amount: bigint,
    commonContentUrl: string
}