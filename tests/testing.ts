import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Testing } from "../target/types/testing";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("testing", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Testing as Program<Testing>;

  let mint: Keypair;
  // Use provider wallet as creator and sender to avoid devnet airdrop issues
  const wallet = provider.wallet as anchor.Wallet;
  const creatorPubkey = wallet.publicKey;
  const senderPubkey = wallet.publicKey;
  const recipientPubkey = Keypair.generate().publicKey;

  it("Initializes the mint with transfer fee", async () => {
    mint = Keypair.generate();
    const feeBps = 100; // 1% fee
    const maxFee = 1000000; // Max fee in smallest unit

    const tx = await program.methods
      .initialize(feeBps, new anchor.BN(maxFee))
      .accounts({
        creator: creatorPubkey,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([mint])
      .rpc();

    console.log(`https://solscan.io/tx/${tx}?cluster=devnet`);
    expect(tx).to.be.a("string");
  });

  it("Mints tokens to recipient", async () => {
    const amount = new anchor.BN(1000 * 1e9); // 1000 tokens with 9 decimals

    const recipientAta = getAssociatedTokenAddressSync(
      mint.publicKey,
      senderPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await program.methods
      .mint(amount)
      .accounts({
        creator: creatorPubkey,
        mint: mint.publicKey,
        recipient: senderPubkey,
        recipientAta: recipientAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      } as any)
      .rpc();

    console.log(`https://solscan.io/tx/${tx}?cluster=devnet`);

    // Verify balance
    const account = await getAccount(
      provider.connection,
      recipientAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    expect(account.amount.toString()).to.equal(amount.toString());
  });

  it("Transfers tokens from recipient to sender", async () => {
    const transferAmount = new anchor.BN(100 * 1e9); // 100 tokens

    const senderAta = getAssociatedTokenAddressSync(
      mint.publicKey,
      senderPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const recipientAta = getAssociatedTokenAddressSync(
      mint.publicKey,
      recipientPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await program.methods
      .transfer(transferAmount)
      .accounts({
        sender: senderPubkey,
        mint: mint.publicKey,
        recipient: recipientPubkey,
        recipientAta: recipientAta,
        senderAta: senderAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      } as any)
      .rpc();

    console.log(`https://solscan.io/tx/${tx}?cluster=devnet`);

    // Verify sender balance
    const senderAccount = await getAccount(
      provider.connection,
      recipientAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    expect(Number(senderAccount.amount)).to.be.greaterThan(0);
  });
});