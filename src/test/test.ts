import * as fs from "fs";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  create,
  mplCandyMachine,
  addConfigLines,
  mintV2,
  ConfigLineArgs,
} from "@metaplex-foundation/mpl-candy-machine";
import {
  TokenStandard,
  createNft,
  fetchDigitalAsset,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  dateTime,
  generateSigner,
  keypairIdentity,
  none,
  percentAmount,
  PublicKey,
  publicKey,
  sol,
  some,
  transactionBuilder,
} from "@metaplex-foundation/umi";
const hexPrivateKey = "yLgNYqUE41Yb7n2k1Fev1McFkVEjdUWwAivL1vD6MNQj8JxtDGtymbJ8MwbtGtjC1cwojGt9Ng91VduFFc7SHNR"; // replace with your actual hex private key
const privateKeyArray = Array.from(Buffer.from(hexPrivateKey, "hex"));
import pkg from 'bs58';
const { decode } = pkg;
console.log({privateKeyArray})
const decoded = decode(hexPrivateKey)


console.log(JSON.stringify(Array.from(decoded)))

import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";

const umi = createUmi("https://api.devnet.solana.com").use(mplCandyMachine());

// const wallet = "/Users/lainhathoang/.config/solana/id.json";

// const secretKey = JSON.parse(fs.readFileSync(wallet, "utf8"));

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array((decoded)));
const keypairSigner = createSignerFromKeypair(umi, keypair);

umi.use(keypairIdentity(keypair));

async function createNftCollection(): Promise<PublicKey> {
  const collectionMint = generateSigner(umi);
  await createNft(umi, {
    mint: collectionMint,
    authority: umi.identity,
    name: "EVENT Wrapper Collection",
    symbol: "EW",
    uri: "https://event-protocol.s3.ap-southeast-1.amazonaws.com/metadata/collection.json",
    sellerFeeBasisPoints: percentAmount(0.0, 2), // 0.00%
    isCollection: true,
  }).sendAndConfirm(umi);

  fs.writeFileSync(
    "./collection_mint.json",
    JSON.stringify(Array.from(collectionMint.secretKey))
  );

  console.log("collectionMint: ", collectionMint.publicKey);
  console.log("=> saved collection mint secret key to collection_mint.json");

  return collectionMint.publicKey;
}

async function createCandyMachine(
  collectionMint: PublicKey
): Promise<PublicKey> {
  const candyMachine = generateSigner(umi);
  const ix = await create(umi, {
    candyMachine,
    symbol: "EW",
    collectionMint: collectionMint,
    collectionUpdateAuthority: umi.identity,
    tokenStandard: TokenStandard.NonFungible,
    sellerFeeBasisPoints: percentAmount(0.0, 2),
    itemsAvailable: 10, // 2000 NFTs
    isMutable: false,
    creators: [
      {
        address: umi.identity.publicKey, // update the creator's address
        verified: true,
        percentageShare: 100,
      },
    ],
    configLineSettings: some({
      prefixName: "EVENT Wrapper #",
      nameLength: 4,
      prefixUri:
        "https://event-protocol.s3.ap-southeast-1.amazonaws.com/metadata/",
      uriLength: 9,
      isSequential: false,
    }),
    hiddenSettings: none(),
    guards: {
      // botTax: some({ lamports: sol(0.0000001), lastInstruction: true }),
      solPayment: some({
        lamports: sol(1), // 1 SOL / package
        destination: publicKey("cbrRgBSrPzrDd3k7DzT94H7fRzqScPrCe6ZV9ZK9FXp"), // update to the admin's wallet address
      }),
      startDate: some({ date: dateTime("2024-01-01T00:00:00Z") }), // update to the start date
      endDate: some({ date: dateTime("2024-12-31T00:00:00Z") }), // update to the end date
    },
  });
  await ix.sendAndConfirm(umi);

  fs.writeFileSync(
    "./candy_machine.json",
    JSON.stringify(Array.from(candyMachine.secretKey))
  );

  console.log("candyMachine: ", candyMachine.publicKey);
  console.log("=> saved candy machine secret key to candy_machine.json");

  return candyMachine.publicKey;
}

async function addItemsToCandyMachine(candyMachine: PublicKey) {
  // insert NFTs into candy machine
  const configLines: ConfigLineArgs[] = [];

  // update the number of items to be added
  for (let i = 0; i < 10; i++) {
    configLines.push({ name: `${i}`, uri: `${i}.json` });
  }

  await addConfigLines(umi, {
    candyMachine: candyMachine,
    index: 0,
    configLines,
  }).sendAndConfirm(umi);

  console.log("=> added items to candy machine");
}

async function mintNft(collectionMint: PublicKey, candyMachine: PublicKey) {
  const collectionNft = await fetchDigitalAsset(umi, collectionMint);

  const nftMint = generateSigner(umi);
  await transactionBuilder()
    .add(setComputeUnitLimit(umi, { units: 800_000 }))
    .add(
      mintV2(umi, {
        candyMachine: candyMachine,
        nftMint: nftMint,
        collectionMint: collectionNft.publicKey,
        collectionUpdateAuthority: collectionNft.metadata.updateAuthority,
        mintArgs: {
          solPayment: some({
            destination: publicKey(
              "cbrRgBSrPzrDd3k7DzT94H7fRzqScPrCe6ZV9ZK9FXp" // update to the admin's wallet address
            ),
          }),
        },
      })
    )
    .sendAndConfirm(umi);

  console.log("minted an NFT: ", nftMint.publicKey);
}

async function main() {
  // const collectionMint = createSignerFromKeypair(
  //   umi,
  //   umi.eddsa.createKeypairFromSecretKey(
  //     new Uint8Array(
  //       JSON.parse(fs.readFileSync("./collection_mint.json", "utf8"))
  //     )
  //   )
  // );
  // const candyMachine = createSignerFromKeypair(
  //   umi,
  //   umi.eddsa.createKeypairFromSecretKey(
  //     new Uint8Array(
  //       JSON.parse(fs.readFileSync("./candy_machine.json", "utf8"))
  //     )
  //   )
  // );
  //
  //
  //
  // 1. create NFT collection
  const collectionMint = await createNftCollection();

  // console.log({collectionMint})
  // 2. create Candy Machine
  const candyMachine = await createCandyMachine(collectionMint);
  // 3. add items to Candy Machine
  await addItemsToCandyMachine(candyMachine);
  // 4. mint NFT
  await mintNft(collectionMint, candyMachine);
}

main().catch(console.error);