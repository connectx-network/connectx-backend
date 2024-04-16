import { Injectable, NotFoundException } from '@nestjs/common';

import { Address, Cell, internal, beginCell, contractAddress, StateInit, SendMode, toNano, address } from 'ton-core';
import { encodeOffChainContent, OpenedWallet, openWallet, waitSeqno } from 'src/utils/nft.util';
import { CollectionData, MintParams } from 'src/types/nft.type';
import { IpfsService } from '../ipfs/ipfs.service';
import { createNftCollectionMetadata, createNftMetadata, NftCollectionMetadata, NftMetadata } from 'src/utils/nft.metadata.util';
import { PrismaService } from '../prisma/prisma.service';
import { TonClient } from 'ton';

@Injectable()
export class NftService {

    constructor(private readonly ipfsService: IpfsService,
        private readonly prisma: PrismaService,
    ) { }
    async getAddressByIndex (
        collectionAddress: string,
        itemIndex: number) {

        console.log(collectionAddress, itemIndex)

        const client = new TonClient({
            endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
            apiKey: process.env.TONCENTER_API_KEY
        });

        const response = await client.runMethod(
            address(collectionAddress),
            "get_nft_address_by_index",
            [{ type: "int", value: BigInt(itemIndex) }]
        );

        console.log(response);

        return response.stack.readAddress();
    }

    async createNftItem (collectionAddress: string, userAddress: string, nftMetadata: NftMetadata) {

        const wallet = await openWallet(process.env.MNEMONIC.split(' '), true)

        const collection = await this.prisma.nftCollection.findFirst({
            where: { nftCollectionAddress: collectionAddress },
            include: { nftItems: true }
        })
        if (!collection) {
            throw new NotFoundException("Nft collection not found")
        }

        const itemIndex = collection.nftItems.length

        const collectionData: CollectionData = {
            ownerAddress: wallet.contract.address,
            royaltyPercent: 0,
            royaltyAddress: wallet.contract.address,
            nextItemIndex: 0,
            collectionContentUrl: collection.collectionContentUrl,
            commonContentUrl: collection.commonContentUrl
        }

        console.log(wallet.contract.address.toString())

        const addressX = this.getAddress(collectionData)

        console.log(addressX.toString(), collection.nftCollectionAddress)

        const metadata = createNftMetadata(nftMetadata)

        const res = await this.ipfsService.uploadJsonToIpfs(metadata, {
            pinataMetadata: { name: nftMetadata.name }
        })

        const mintParams: MintParams = {
            queryId: 0,
            itemOwnerAddress: address(userAddress),
            itemIndex: itemIndex,
            amount: toNano('0.005'),
            commonContentUrl: `https://turquoise-zygotic-puma-534.mypinata.cloud/ipfs/${res.IpfsHash}`
        }

        console.log('before topUpBalance')
        const seqnoBal = await this.topUpBalance({
            wallet: wallet,
            nftAmount: 1,
            collectionAddress: address(collection.nftCollectionAddress),
        })

        console.log('seqnoBal', seqnoBal)

        await waitSeqno(seqnoBal, wallet);

        const seqno = await wallet.contract.getSeqno();

        console.log('seqno', seqno)

        try {
            await wallet.contract.sendTransfer({
                seqno,
                secretKey: wallet.keypair.secretKey,
                messages: [
                    internal({
                        value: "0.05",
                        to: address(collection.nftCollectionAddress),
                        body: this.createMintBody(mintParams),
                    }),
                ],
                sendMode: SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
            });

            await waitSeqno(seqno, wallet);

            await this.prisma.nftCollection.update({
                where: { id: collection.id },
                data: {
                    nftItems: {
                        create: {
                            itemOwnerAddress: userAddress,
                            queryId: mintParams.queryId,
                            itemIndex: mintParams.itemIndex,
                            amount: mintParams.amount,
                            commonContentUrl: mintParams.commonContentUrl
                        }
                    }
                }
            })

            return seqno;

        } catch (error) {
            console.log(error)
        }

    }

    async createCollection (metadata: NftCollectionMetadata) {

        const metadataString = createNftCollectionMetadata(metadata)

        const res = await this.ipfsService.uploadJsonToIpfs(metadataString, { pinataMetadata: { name: metadata.name } })

        const wallet = await openWallet(process.env.MNEMONIC.split(' '), true)

        const collectionData: CollectionData = {
            ownerAddress: wallet.contract.address,
            royaltyPercent: 0,
            royaltyAddress: wallet.contract.address,
            nextItemIndex: 0,
            collectionContentUrl: `https://turquoise-zygotic-puma-534.mypinata.cloud/ipfs/${res.IpfsHash}`,
            commonContentUrl: `https://turquoise-zygotic-puma-534.mypinata.cloud/ipfs/`,
        }

        const nftCollection = await this.prisma.nftCollection.create({
            data: {
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                coverImage: metadata.cover_image,
                socialLinks: metadata.social_links,
                ownerAddress: collectionData.ownerAddress.toString(),
                royaltyPercent: collectionData.royaltyPercent,
                royaltyAddress: collectionData.royaltyAddress.toString(),
                nextItemIndex: collectionData.nextItemIndex,
                collectionContentUrl: collectionData.collectionContentUrl,
                commonContentUrl: collectionData.commonContentUrl,
            }
        })

        let { seqno, address } = await this.deployCollection(wallet, collectionData);

        await waitSeqno(seqno, wallet);

        if (address) {
            await this.prisma.nftCollection.update({
                where: { id: nftCollection.id },
                data: {
                    nftCollectionAddress: address.toString()
                }

            })
        }

        console.log(`Collection deployed: ${address}`);

        return { collectionAddress: address.toString({ bounceable: false }) };
    }


    async deployCollection (wallet: OpenedWallet, collectionData: CollectionData) {
        const seqno = await wallet.contract.getSeqno();

        const address = this.getAddress(collectionData)

        const init = this.stateInit(collectionData)

        await wallet.contract.sendTransfer({
            seqno,
            secretKey: wallet.keypair.secretKey,
            messages: [
                internal({
                    value: "0.05",
                    to: address,
                    init: init,
                }),
            ],
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        });
        return { seqno, address };
    }

    async topUpBalance ({ wallet, nftAmount, collectionAddress }: { wallet: OpenedWallet, nftAmount: number, collectionAddress: Address }) {
        const feeAmount = 0.026 // approximate value of fees for 1 transaction in our case

        const seqno = await wallet.contract.getSeqno();
        const amount = nftAmount * feeAmount;

        try {
            await wallet.contract.sendTransfer({
                seqno,
                secretKey: wallet.keypair.secretKey,
                messages: [
                    internal({
                        value: amount.toString(),
                        to: collectionAddress,
                        body: new Cell(),
                    }),
                ],
                sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            });
        } catch (error) {
            console.log(error)
        }



        console.log("topUpBalance end", seqno)

        return seqno;

    }

    public getAddress (collectionData: CollectionData) {
        const stateInit = this.stateInit(collectionData)

        return contractAddress(0, stateInit)
    }

    public stateInit (collectionData: CollectionData) {
        const code = this.createCodeCell();
        const data = this.createDataCell(collectionData);

        return { code, data };
    }

    private createMintBody (params: MintParams) {
        const body = beginCell();
        body.storeUint(1, 32);
        body.storeUint(params.queryId || 0, 64);
        body.storeUint(params.itemIndex, 64);
        body.storeCoins(params.amount);

        const nftItemContent = beginCell();
        nftItemContent.storeAddress(params.itemOwnerAddress);

        const uriContent = beginCell();
        uriContent.storeBuffer(Buffer.from(params.commonContentUrl));
        nftItemContent.storeRef(uriContent.endCell());

        body.storeRef(nftItemContent.endCell());
        return body.endCell();
    }

    private createDataCell (data: CollectionData) {
        const dataCell = beginCell();
        dataCell.storeAddress(data.ownerAddress);
        dataCell.storeUint(data.nextItemIndex, 64);
        const contentCell = beginCell();

        const collectionContent = encodeOffChainContent(data.collectionContentUrl);

        const commonContent = beginCell();
        commonContent.storeBuffer(Buffer.from(data.commonContentUrl));

        contentCell.storeRef(collectionContent);
        contentCell.storeRef(commonContent.asCell());
        dataCell.storeRef(contentCell);

        const NftItemCodeCell = Cell.fromBase64(
            "te6cckECDQEAAdAAART/APSkE/S88sgLAQIBYgMCAAmhH5/gBQICzgcEAgEgBgUAHQDyMs/WM8WAc8WzMntVIAA7O1E0NM/+kAg10nCAJp/AfpA1DAQJBAj4DBwWW1tgAgEgCQgAET6RDBwuvLhTYALXDIhxwCSXwPg0NMDAXGwkl8D4PpA+kAx+gAxcdch+gAx+gAw8AIEs44UMGwiNFIyxwXy4ZUB+kDUMBAj8APgBtMf0z+CEF/MPRRSMLqOhzIQN14yQBPgMDQ0NTWCEC/LJqISuuMCXwSED/LwgCwoAcnCCEIt3FzUFyMv/UATPFhAkgEBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7AAH2UTXHBfLhkfpAIfAB+kDSADH6AIIK+vCAG6EhlFMVoKHeItcLAcMAIJIGoZE24iDC//LhkiGOPoIQBRONkchQCc8WUAvPFnEkSRRURqBwgBDIywVQB88WUAX6AhXLahLLH8s/Im6zlFjPFwGRMuIByQH7ABBHlBAqN1viDACCAo41JvABghDVMnbbEDdEAG1xcIAQyMsFUAfPFlAF+gIVy2oSyx/LPyJus5RYzxcBkTLiAckB+wCTMDI04lUC8ANqhGIu"
        );
        dataCell.storeRef(NftItemCodeCell);

        const royaltyBase = 1000;
        const royaltyFactor = Math.floor(data.royaltyPercent * royaltyBase);

        const royaltyCell = beginCell();
        royaltyCell.storeUint(royaltyFactor, 16);
        royaltyCell.storeUint(royaltyBase, 16);
        royaltyCell.storeAddress(data.royaltyAddress);
        dataCell.storeRef(royaltyCell);

        return dataCell.endCell();
    }

    private createCodeCell () {
        const NftFixPriceSaleV2CodeBoc =
            "te6cckECDAEAAikAART/APSkE/S88sgLAQIBIAMCAATyMAIBSAUEAFGgOFnaiaGmAaY/9IH0gfSB9AGoYaH0gfQB9IH0AGEEIIySsKAVgAKrAQICzQgGAfdmCEDuaygBSYKBSML7y4cIk0PpA+gD6QPoAMFOSoSGhUIehFqBSkHCAEMjLBVADzxYB+gLLaslx+wAlwgAl10nCArCOF1BFcIAQyMsFUAPPFgH6AstqyXH7ABAjkjQ04lpwgBDIywVQA88WAfoCy2rJcfsAcCCCEF/MPRSBwCCIYAYyMsFKs8WIfoCy2rLHxPLPyPPFlADzxbKACH6AsoAyYMG+wBxVVAGyMsAFcsfUAPPFgHPFgHPFgH6AszJ7VQC99AOhpgYC42EkvgnB9IBh2omhpgGmP/SB9IH0gfQBqGBNgAPloyhFrpOEBWccgGRwcKaDjgskvhHAoomOC+XD6AmmPwQgCicbIiV15cPrpn5j9IBggKwNkZYAK5Y+oAeeLAOeLAOeLAP0BZmT2qnAbE+OAcYED6Y/pn5gQwLCQFKwAGSXwvgIcACnzEQSRA4R2AQJRAkECPwBeA6wAPjAl8JhA/y8AoAyoIQO5rKABi+8uHJU0bHBVFSxwUVsfLhynAgghBfzD0UIYAQyMsFKM8WIfoCy2rLHxnLPyfPFifPFhjKACf6AhfKAMmAQPsAcQZQREUVBsjLABXLH1ADzxYBzxYBzxYB+gLMye1UABY3EDhHZRRDMHDwBTThaBI=";

        return Cell.fromBase64(NftFixPriceSaleV2CodeBoc);
    }
}
