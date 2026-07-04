# SETUP — going from mock mode to real Casper testnet

Imprint runs fully in **mock mode** with no setup. This guide switches it to
**real mode**, where each memory op settles a real CEP-18 token transfer on
Casper **testnet** via the x402 facilitator. Test CSPR has no monetary value.

> The real signing is already IMPLEMENTED (EIP-712 TransferWithAuthorization via
> `@casper-ecosystem/casper-eip-712`). What remains is wiring hackathon credentials
> and two quick confirmations against a live facilitator (step 7).

## 1. Get a Casper testnet wallet + funds
1. Install the **Casper Wallet** browser extension → https://www.casperwallet.io
2. Create an account, then switch the network to **Testnet**.
3. Get **5,000 free test CSPR**: https://testnet.cspr.live/tools/faucet
   (log in with Casper Wallet → Tools → Faucet). ⚠️ Works **once per account** —
   a second request fails with `User error: 1`.

## 2. Export the agent's private key
- In Casper Wallet, export the account's **Ed25519 private key hex**.
- Put it in `.env` as `CASPER_PRIVATE_KEY_HEX=…` (this is the payer/agent key).
- 🔒 Never commit `.env` (it's git-ignored).

## 3. Get a CSPR.cloud token
- Register at the CSPR.build console → https://console.cspr.build/sign-up
- Mint an access token → `.env` as `CSPR_CLOUD_TOKEN=…`
  (use the **raw token value**, NOT `Bearer …`).

## 4. Confirm the facilitator credential
- The buildathon gives teams **sponsored (free) x402 facilitator usage**. Confirm
  whether the facilitator accepts your normal CSPR.cloud token or a separate
  hackathon-issued key, and set `CASPER_FACILITATOR_URL=https://x402-facilitator.cspr.cloud`.

## 5. Discover what the facilitator accepts
```bash
curl -s https://x402-facilitator.cspr.cloud/supported -H "authorization: $CSPR_CLOUD_TOKEN"
```
- From the response set `X402_NETWORK` (expect `casper:casper-test`) and
  `X402_ASSET` = the accepted **CEP-18 token contract hash**.
- Set `X402_TOKEN_NAME` + `X402_TOKEN_VERSION` to that token's EIP-712 domain
  name/version (used to build the signing domain). If unknown, try the token
  symbol and `1`.

## 6. Set the payee
- `X402_PAY_TO` = the account (public key hex / account hash) that should **receive**
  payments — for a demo this can be your own account.

## 7. Signing is implemented — confirm 2 things against a live facilitator
`src/casper/casper-facilitator.ts` already implements the real scheme, verified
against **github.com/make-software/casper-x402** + docs.cspr.cloud/x402-facilitator-api:

- **x402 v2 body** for `/verify` + `/settle` — `paymentPayload` nests
  `payload`/`resource`/`accepted`; `paymentRequirements` uses `amount`. ✅ done
- **EIP-712 signing** — Ed25519 over the 32-byte `TransferWithAuthorization`
  digest from `@casper-ecosystem/casper-eip-712` (`buildDomain` → `hashTypedData`),
  encoded `[0x01] + sig` → 130 hex chars. ✅ done

Two things can only be confirmed once you POST to the real facilitator with a
valid token; if `/verify` rejects a payment, adjust in that one file:

1. The EIP-712 `primaryType` string (we send `"TransferWithAuthorization"`).
2. `casper-js-sdk` v5's `sign()` return encoding (we normalize it defensively to
   `[0x01] + 64 sig bytes`).

Until you run against the real facilitator, **mock mode stays the working default.**

## 8. Flip the switch
```env
IMPRINT_MODE=real
```
Re-run the **same** commands (`npm run http`, `npm run demo auto`). Store/recall now
settle on testnet; the returned `tx=…` is a real hash — look it up on
https://testnet.cspr.live .

---

## Open questions to resolve with hackathon materials
- ~~Exact signing algorithm~~ — **RESOLVED**: EIP-712 TransferWithAuthorization via
  `@casper-ecosystem/casper-eip-712`, implemented in `casper-facilitator.ts`.
- Whether the facilitator needs the hackathon-issued credential vs a normal
  CSPR.cloud token. *(Resolve from organizers.)*
- Which CEP-18 token contract + network the facilitator settles on testnet.
  *(Resolve from `GET /supported`.)*
- Whether the x402 track wants an on-chain **receipt beyond** the settlement tx
  (e.g. a contract write). The MVP treats the settle tx hash as the receipt to
  avoid custom Odra/Rust contracts — confirm that satisfies the track.
