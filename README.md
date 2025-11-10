<div align="center">
  <img alt="Solana" src="https://raw.githubusercontent.com/solana-labs/solana/master/docs/static/img/solanaLogoMark.svg" height="40" />
  &nbsp;&nbsp;
  <img alt="Anchor" src="https://raw.githubusercontent.com/coral-xyz/anchor/master/logo.png" height="40" />
  &nbsp;&nbsp;
  <img alt="Rust" src="https://www.rust-lang.org/static/images/rust-logo-blk.svg" height="40" />
  &nbsp;&nbsp;
  <img alt="TypeScript" src="https://raw.githubusercontent.com/remojansen/logo.ts/master/ts.png" height="40" />
  <br/>
  <h2>Testing - Token-2022 Transfer-Fee Demo (Anchor)</h2>
  <p>Solana program demonstrating Token-2022 mint init with transfer fee, mint, transfer, and withdraw withheld fees.</p>
</div>

---

### What this program does
- Initializes a Token-2022 mint with the Transfer Fee extension enabled.
- Mints tokens to any recipient’s associated token account (ATA).
- Transfers tokens between accounts using Token-2022 `transfer_checked`.
- Withdraws withheld fees from accounts (authority: creator).

Program entrypoints are in `programs/testing/src/lib.rs` calling helpers in `programs/testing/src/instructions/*`.

### High-level flow

```mermaid
flowchart LR
    A[Creator Wallet] -->|initialize(fee_bps,max_fee)| M((Token-2022 Mint))
    M -->|mint(amount)| R[Recipient ATA]
    R -->|transfer(amount)| S[Sender/Other ATA]
    A -->|withdraw_withheld_fees| A
```

Key pieces:
- `initialize`: creates a mint account sized for extensions, initializes transfer fee config, then initializes the mint.
- `mint`: mints to recipient ATA (created if needed).
- `transfer`: transfers with fee deduction per mint configuration.
- `withdraw`: withdraws withheld fees from provided accounts to the creator’s ATA.

---

### Repo layout
- `programs/testing/src/instructions/initialize.rs`: Create mint, enable TransferFee, initialize mint.
- `programs/testing/src/instructions/mint.rs`: Mint tokens to recipient ATA.
- `programs/testing/src/instructions/transfer.rs`: Transfer tokens with Token-2022 `transfer_checked`.
- `programs/testing/src/instructions/withdraw.rs`: Withdraw withheld tokens (fees).
- `tests/testing.ts`: Simple end-to-end devnet test using the provider wallet.

---

### Prerequisites
- Rust + Solana toolchain
- Anchor CLI `>= 0.32.1`
- A devnet wallet with SOL at `~/.config/solana/id.json`

Quick sanity:
```bash
solana --version
anchor --version
solana config set --url https://api.devnet.solana.com
```

---

### Build and deploy
```bash
anchor build
anchor test
```

This project’s tests deploy to devnet automatically (see `Anchor.toml`), then run the mocha suite.

---

### How the test works
The test avoids devnet faucet flakiness by using the provider wallet as payer/authority:
1) Initialize mint (with transfer fee configuration)
2) Mint tokens to the provider wallet’s ATA
3) Transfer some tokens to a fresh recipient

Transactions are logged with Solscan links.

#### Example successful run (from your terminal logs)
```text
testing
https://solscan.io/tx/5Pik3wJQoCmZmM7PvEZV5GtJvB5XhutLapJrKBWERXFKoeJR9EwioD6w1tHDTD63bNbutn9vxxB2iwh1wz6KEpXX?cluster=devnet
    ✔ Initializes the mint with transfer fee (2816ms)
https://solscan.io/tx/uujnGzepvgKE4Egjhpmjs9pTRFV9gKaJVNErM3EshhHqyr2Wcm4qsmcPPgTZzkLQAgwW95K5iFLq17pVzPVEy7A?cluster=devnet
    ✔ Mints tokens to recipient (2446ms)
https://solscan.io/tx/34b1wE6Ubir8sPh6gbBUXSnRViddz5ukPhPN2G3ZNFDAvGoHD1yX16AxcsAbS9RK5fy5t63nb8aVbxzoYyuynRYM?cluster=devnet
    ✔ Transfers tokens from recipient to sender (1152ms)

  3 passing (6s)
```

---

### Running the tests yourself
```bash
# Ensure devnet RPC is set and your wallet has some SOL
solana config set --url https://api.devnet.solana.com
solana balance

# Run tests
anchor test
```

During the run, look for lines like:
```
https://solscan.io/tx/<SIG>?cluster=devnet
```
Open them in a browser to inspect each transaction on Solscan.

---

### Notes and tips
- If you see airdrop errors on devnet, prefer using the provider wallet as done in the test, or run against `localnet`:
  ```bash
  anchor localnet
  ```
- Token-2022 requires using the Token-2022 program ID for mint/ATA ops.
- The `withdraw` instruction requires creator authority and a list of accounts to collect withheld fees from.

---

### License
ISC


