import { daoKey, init } from "@helium/helium-sub-daos-sdk";
import { init as initVsr } from "@helium/voter-stake-registry-sdk";
import { AssetProof, chunks, getAssetProof, getAssetsByOwner, HNT_MINT } from "@helium/spl-utils";
import { registrarCollectionKey } from "@helium/voter-stake-registry-sdk";
import {
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  createTransferInstruction,
} from "@metaplex-foundation/mpl-bubblegum";
import { ConcurrentMerkleTreeAccount, SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, SPL_NOOP_PROGRAM_ID } from "@solana/spl-account-compression";
import { createTransferCheckedInstruction, createTransferInstruction as createTokenTransfer, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AccountMeta, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { provider } from "./solana";


export async function getMigrateTransactions(from: PublicKey, to: PublicKey): Promise<Transaction[]> {
  const assetApiUrl =
    process.env.ASSET_API_URL ||
    provider.connection.rpcEndpoint;
  const assets = await getAssetsByOwner(assetApiUrl, from.toBase58());

  const uniqueAssets = new Set(assets.map(asset => asset.id.toBase58()));
  const hsdProgram = await init(provider);
  const vsrProgram = await initVsr(provider);

  const dao = await hsdProgram.account.daoV0.fetch(daoKey(HNT_MINT)[0]);
  const positionCollection = registrarCollectionKey(dao.registrar)[0];
  const positions = assets.filter(asset => asset.grouping && asset.grouping.equals(positionCollection));
  const normalAssets = assets.filter(asset => !asset.grouping || !asset.grouping.equals(positionCollection));

  const transferAssetIxns: TransactionInstruction[] = [];
  for (const asset of normalAssets) {
    if (asset.compression.compressed) {
      const proof = await getAssetProof(assetApiUrl, asset.id);
      if (proof) {
        const treeAuthority = await getBubblegumAuthorityPDA(
          new PublicKey(proof.treeId)
        );

        const leafDelegate = asset.ownership.owner;
        const merkleTree = new PublicKey(proof.treeId);
        const tree = await ConcurrentMerkleTreeAccount.fromAccountAddress(
          provider.connection,
          merkleTree,
          "confirmed"
        );
        const canopyHeight = tree.getCanopyDepth();
        const proofPath = mapProof(proof);
        const anchorRemainingAccounts = proofPath.slice(
          0,
          proofPath.length - (canopyHeight || 0)
        );

        transferAssetIxns.push(
          createTransferInstruction(
            {
              treeAuthority,
              leafOwner: asset.ownership.owner,
              leafDelegate,
              newLeafOwner: to,
              merkleTree,
              logWrapper: SPL_NOOP_PROGRAM_ID,
              compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
              anchorRemainingAccounts,
            },
            {
              root: [...proof.root.toBuffer()],
              dataHash: [...asset.compression.dataHash!],
              creatorHash: [...asset.compression.creatorHash!],
              nonce: asset.compression.leafId!,
              index: asset.compression.leafId!,
            }
          )
        );
      }
    } else {
      const fromAta = getAssociatedTokenAddressSync(asset.id, from);
      const toAta = getAssociatedTokenAddressSync(asset.id, to);
      transferAssetIxns.push(
        createTransferCheckedInstruction(
          fromAta,
          asset.id,
          toAta,
          from,
          1,
          0
        )
      )
    }
  }

  const transferPositionIxns = await Promise.all(positions.map(async position => {
    return await vsrProgram.methods.ledgerTransferPositionV0()
    .accounts({
      to,
      from,
      mint: position.id,
    })
    .instruction()
  }))

  const tokens = await provider.connection.getParsedTokenAccountsByOwner(from, {
    programId: TOKEN_PROGRAM_ID,
  });

  const transferTokenInstructions = tokens.value.filter(token => !uniqueAssets.has(token.account.data.parsed.info.mint)).map(token => {
    const mint = token.account.data.parsed.info.mint
    const fromAta = token.pubkey;
    const toAta = getAssociatedTokenAddressSync(mint, to);
    return createTokenTransfer(
      fromAta,
      toAta,
      from,
      token.account.data.parsed.info.tokenAmount.amount,
    );
  })

  const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash
  const transactions: Transaction[] = [];
  chunks(transferAssetIxns, 3).forEach((chunk) => {
    const tx = new Transaction({
      feePayer: from,
      recentBlockhash,
    });
    tx.add(...chunk);
    transactions.push(tx);
  });
  
  if (transferPositionIxns.length > 0) {
    const tx = new Transaction({
      feePayer: from,
      recentBlockhash,
    });
    tx.add(...transferAssetIxns);
    transactions.push(await provider.wallet.signTransaction(tx));
  }
  if (transferTokenInstructions.length > 0) {
    const tx = new Transaction({
      feePayer: from,
      recentBlockhash,
    });
    tx.add(...transferAssetIxns);
    transactions.push(tx);
  }

  return transactions;
}

const mapProof = (assetProof: AssetProof): AccountMeta[] => {
  if (!assetProof.proof || assetProof.proof.length === 0) {
    throw new Error("Proof is empty");
  }
  return assetProof.proof.map((node) => ({
    pubkey: new PublicKey(node),
    isSigner: false,
    isWritable: false,
  }));
};

const getBubblegumAuthorityPDA = async (merkleRollPubKey: PublicKey) => {
  const [bubblegumAuthorityPDAKey] = await PublicKey.findProgramAddress(
    [merkleRollPubKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );
  return bubblegumAuthorityPDAKey;
};