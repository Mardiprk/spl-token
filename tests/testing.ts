import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Testing } from "../target/types/testing";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("testing", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Testing as Program<Testing>;

  let mint: Keypair;
  let creator: Keypair;
  let recipient: Keypair;
  let sender: Keypair;

  before(async () => {
    // Airdrop SOL to creator
    creator = Keypair.generate();
    const signature = await provider.connection.requestAirdrop(
      creator.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Airdrop SOL to recipient
    recipient = Keypair.generate();
    const signature2 = await provider.connection.requestAirdrop(
      recipient.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature2);

    // Airdrop SOL to sender
    sender = Keypair.generate();
    const signature3 = await provider.connection.requestAirdrop(
      sender.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature3);
  });

  it("Initializes the mint with transfer fee", async () => {
    mint = Keypair.generate();
    const feeBps = 100; // 1% fee
    const maxFee = 1000000; // Max fee in smallest unit

    const tx = await program.methods
      .initialize(feeBps, new anchor.BN(maxFee))
      .accounts({
        creator: creator.publicKey,
        mint: mint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([creator, mint])
      .rpc();

    console.log("Initialize transaction:", tx);
    expect(tx).to.be.a("string");
  });

  it("Mints tokens to recipient", async () => {
    const amount = new anchor.BN(1000 * 1e9); // 1000 tokens with 9 decimals

    const recipientAta = getAssociatedTokenAddressSync(
      mint.publicKey,
      recipient.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await program.methods
      .mint(amount)
      .accounts({
        creator: creator.publicKey,
        mint: mint.publicKey,
        recipient: recipient.publicKey,
        recipientAta: recipientAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      } as any)
      .signers([creator])
      .rpc();

    console.log("Mint transaction:", tx);

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
      sender.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const recipientAta = getAssociatedTokenAddressSync(
      mint.publicKey,
      recipient.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // Create sender ATA if needed
    const createAtaIx = createAssociatedTokenAccountInstruction(
      sender.publicKey,
      senderAta,
      sender.publicKey,
      mint.publicKey,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await program.methods
      .transfer(transferAmount)
      .accounts({
        sender: recipient.publicKey,
        mint: mint.publicKey,
        recipient: sender.publicKey,
        recipientAta: senderAta,
        senderAta: recipientAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      } as any)
      .preInstructions([createAtaIx])
      .signers([recipient])
      .rpc();

    console.log("Transfer transaction:", tx);

    // Verify sender balance
    const senderAccount = await getAccount(
      provider.connection,
      senderAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    expect(Number(senderAccount.amount)).to.be.greaterThan(0);
    console.log("Sender balance:", senderAccount.amount.toString());
  });
});