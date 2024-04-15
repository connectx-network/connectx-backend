import { Injectable } from '@nestjs/common';

import { Address, Cell, internal, beginCell, contractAddress, StateInit, SendMode } from 'ton-core';
import { encodeOffChainContent, OpenedWallet, openWallet, waitSeqno } from 'src/utils/nft.util';
import { CollectionData, MintParams } from 'src/types/nft.type';
import { IpfsService } from '../ipfs/ipfs.service';
import { createNftCollectionMetadata, NftCollectionMetadata } from 'src/utils/nft.metadata.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NftService {

    constructor(private readonly ipfsService: IpfsService,
        private readonly prisma: PrismaService,
    ) { }


    async createNftItem () {
        const wallet = await openWallet(process.env.MNEMONIC.split(''))
    }

    async createCollection (metadata: NftCollectionMetadata) {

        const metadataString = createNftCollectionMetadata(metadata)

        const res = await this.ipfsService.uploadJsonToIpfs(metadataString, { pinataMetadata: { name: metadata.name } })

        console.log(res)

        const wallet = await openWallet(process.env.MNEMONIC.split(''))

        console.log("wallet:", wallet.keypair.publicKey)

        const collectionData: CollectionData = {
            ownerAddress: wallet.contract.address,
            royaltyPercent: 0, // 0.05 = 5%
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

        let seqno = await this.deployCollection(wallet, collectionData);
        console.log(`Collection deployed: ${this.getAddress(collectionData)}`);

        await waitSeqno(seqno, wallet);

        const collectionAddress = this.getAddress(collectionData)

        if (collectionAddress) {
            await this.prisma.nftCollection.update({
                where: { id: nftCollection.id },
                data: {
                    nftCollectionAddress: collectionAddress.toString()
                }

            })
        }

        return collectionAddress
    }


    async deployCollection (wallet: OpenedWallet, collectionData: CollectionData) {
        const seqno = await wallet.contract.getSeqno();

        await wallet.contract.sendTransfer({
            seqno,
            secretKey: wallet.keypair.secretKey,
            messages: [
                internal({
                    value: "0.05",
                    to: this.getAddress(collectionData),
                    init: this.stateInit(collectionData)
                })
            ],
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        })

        console.log("deployCollection after transfer complete")

        return seqno
    }

    async topUpBalance ({ wallet, nftAmount, collectionData }: { wallet: OpenedWallet, nftAmount: number, collectionData: CollectionData }) {
        const feeAmount = 0.026 // approximate value of fees for 1 transaction in our case

        const seqno = await wallet.contract.getSeqno();
        const amount = nftAmount * feeAmount;

        await wallet.contract.sendTransfer({
            seqno,
            secretKey: wallet.keypair.secretKey,
            messages: [
                internal({
                    value: amount.toString(),
                    to: this.getAddress(collectionData).toString({ bounceable: false }),
                    body: new Cell(),
                }),
            ],
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        });

        return seqno;

    }

    public getAddress (collectionData: CollectionData) {
        return contractAddress(0, this.stateInit(collectionData))
    }

    public stateInit (collectionData: CollectionData) {
        const code = this.createCodeCell();
        const data = this.createDataCell(collectionData);

        return { code, data };
    }

    private createMintBody (params: MintParams) {
        const body = beginCell()
        body.storeUint(1, 32)
        body.storeUint(params.queryId || 0, 64)
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
        const dataCell = beginCell()
        dataCell.storeAddress(data.ownerAddress)
        dataCell.storeUint(data.nextItemIndex, 64)

        const contentCell = beginCell()

        const collectionContent = encodeOffChainContent(data.collectionContentUrl);

        const commonCell = beginCell();
        commonCell.storeBuffer(Buffer.from(data.commonContentUrl));

        contentCell.storeRef(collectionContent)
        contentCell.storeRef(commonCell.asCell())
        dataCell.storeRef(contentCell)

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
        const NftCollectionCodeBoc =
            "te6cckECFAEAAh8AART/APSkE/S88sgLAQIBYgkCAgEgBAMAJbyC32omh9IGmf6mpqGC3oahgsQCASAIBQIBIAcGAC209H2omh9IGmf6mpqGAovgngCOAD4AsAAvtdr9qJofSBpn+pqahg2IOhph+mH/SAYQAEO4tdMe1E0PpA0z/U1NQwECRfBNDUMdQw0HHIywcBzxbMyYAgLNDwoCASAMCwA9Ra8ARwIfAFd4AYyMsFWM8WUAT6AhPLaxLMzMlx+wCAIBIA4NABs+QB0yMsCEsoHy//J0IAAtAHIyz/4KM8WyXAgyMsBE/QA9ADLAMmAE59EGOASK3wAOhpgYC42Eit8H0gGADpj+mf9qJofSBpn+pqahhBCDSenKgpQF1HFBuvgoDoQQhUZYBWuEAIZGWCqALnixJ9AQpltQnlj+WfgOeLZMAgfYBwGyi544L5cMiS4ADxgRLgAXGBEuAB8YEYGYHgAkExIREAA8jhXU1DAQNEEwyFAFzxYTyz/MzMzJ7VTgXwSED/LwACwyNAH6QDBBRMhQBc8WE8s/zMzMye1UAKY1cAPUMI43gED0lm+lII4pBqQggQD6vpPywY/egQGTIaBTJbvy9AL6ANQwIlRLMPAGI7qTAqQC3gSSbCHis+YwMlBEQxPIUAXPFhPLP8zMzMntVABgNQLTP1MTu/LhklMTugH6ANQwKBA0WfAGjhIBpENDyFAFzxYTyz/MzMzJ7VSSXwXiN0CayQ==";
        return Cell.fromBase64(NftCollectionCodeBoc);
    }
}
