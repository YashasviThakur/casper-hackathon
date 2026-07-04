import { randomBytes } from 'node:crypto';
import type { AppConfig } from '../config.js';
import type { Facilitator } from './facilitator.js';
import type {
  Authorization,
  PaymentPayload,
  PaymentRequirements,
  SettlementResponse,
  SupportedKinds,
  VerifyResponse,
} from '../x402/types.js';

/**
 * REAL_MODE facilitator — settles on the Casper x402 Facilitator
 * (x402-facilitator.cspr.cloud), using the EXACT wire format + signing scheme
 * from the reference implementation (github.com/make-software/casper-x402) and
 * docs.cspr.cloud/x402-facilitator-api. Verified July 2026:
 *
 *  • x402 VERSION 2. /verify and /settle take:
 *      { paymentPayload: { x402Version: 2,
 *          payload: { signature, publicKey, authorization{from,to,value,validAfter,validBefore,nonce} },
 *          resource: { url }, accepted: { scheme,network,asset,amount,payTo,maxTimeoutSeconds,extra } },
 *        paymentRequirements: { scheme,network,payTo,amount,asset,maxTimeoutSeconds,extra } }
 *    Note the facilitator uses `amount` (we carry it as maxAmountRequired internally).
 *  • SIGNATURE = Ed25519 over the 32-byte EIP-712 digest of a TransferWithAuthorization
 *    message, encoded as [algo-prefix 0x01][64 sig bytes] => 130 hex chars.
 *    EIP-712 types (EIP-3009): from/to = address, value/validAfter/validBefore = uint256,
 *    nonce = bytes32. Domain = buildDomain(tokenName, tokenVersion, chainName, cep18ContractHash).
 *
 * casper-js-sdk and @casper-ecosystem/casper-eip-712 are loaded via indirect
 * dynamic import so MOCK MODE never touches them (and typecheck never needs them).
 * Mock mode stays the working default.
 *
 * ⚠️ To actually settle you still need (see SETUP.md), all from GET /supported:
 * the hackathon facilitator token (CSPR_CLOUD_TOKEN), the accepted CEP-18 asset
 * contract (X402_ASSET) and its token name/version (X402_TOKEN_NAME / X402_TOKEN_VERSION).
 * The two things to confirm against a LIVE facilitator: the EIP-712 primaryType
 * string and casper-js-sdk's sign() return encoding (handled defensively below).
 */
export class CasperFacilitator implements Facilitator {
  private keyPromise?: Promise<any>;

  constructor(private cfg: AppConfig) {}

  private async loadKey(): Promise<any> {
    if (!this.keyPromise) {
      const spec = 'casper-js-sdk';
      this.keyPromise = (async () => {
        const sdk: any = await import(spec);
        const { PrivateKey, KeyAlgorithm } = sdk;
        return PrivateKey.fromHex(this.cfg.casperPrivateKeyHex, KeyAlgorithm.ED25519);
      })();
    }
    return this.keyPromise;
  }

  private headers(): Record<string, string> {
    // CSPR.cloud uses the RAW token as the Authorization value (NO 'Bearer' prefix).
    return { 'content-type': 'application/json', Authorization: this.cfg.csprCloudToken };
  }

  /** CAIP-2 network ("casper:casper-test") -> Casper chain name ("casper-test"). */
  private chainName(): string {
    if (this.cfg.network.includes('casper-test')) return 'casper-test';
    if (this.cfg.network.endsWith(':casper')) return 'casper-net-1';
    return this.cfg.network.split(':').pop() ?? this.cfg.network;
  }

  /** Build the exact x402-v2 body the Casper facilitator's /verify + /settle expect. */
  private casperBody(p: PaymentPayload, r: PaymentRequirements) {
    const accepted = {
      scheme: r.scheme,
      network: r.network,
      asset: r.asset,
      amount: r.maxAmountRequired,
      payTo: r.payTo,
      maxTimeoutSeconds: r.maxTimeoutSeconds,
      extra: r.extra ?? {},
    };
    return {
      paymentPayload: {
        x402Version: 2,
        payload: p.payload,
        resource: { url: r.resource },
        accepted,
      },
      paymentRequirements: {
        scheme: r.scheme,
        network: r.network,
        payTo: r.payTo,
        amount: r.maxAmountRequired,
        asset: r.asset,
        maxTimeoutSeconds: r.maxTimeoutSeconds,
        extra: r.extra ?? {},
      },
    };
  }

  async supported(): Promise<SupportedKinds> {
    const res = await fetch(`${this.cfg.facilitatorUrl}/supported`, { headers: this.headers() });
    if (!res.ok) throw new Error(`facilitator /supported ${res.status}: ${await res.text()}`);
    return (await res.json()) as SupportedKinds;
  }

  async verify(p: PaymentPayload, r: PaymentRequirements): Promise<VerifyResponse> {
    try {
      const res = await fetch(`${this.cfg.facilitatorUrl}/verify`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(this.casperBody(p, r)),
      });
      if (!res.ok) return { isValid: false, invalidReason: `facilitator ${res.status}: ${await res.text()}` };
      const j: any = await res.json();
      return { isValid: !!j.isValid, payer: j.payer, invalidReason: j.invalidReason ?? j.invalidMessage };
    } catch (e) {
      return { isValid: false, invalidReason: `facilitator unreachable: ${(e as Error).message}` };
    }
  }

  async settle(p: PaymentPayload, r: PaymentRequirements): Promise<SettlementResponse> {
    try {
      const res = await fetch(`${this.cfg.facilitatorUrl}/settle`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(this.casperBody(p, r)),
      });
      const j: any = await res.json().catch(() => ({}));
      if (!res.ok || !j.success) {
        return {
          success: false,
          transaction: j.transaction ?? '',
          network: r.network,
          payer: j.payer ?? '',
          errorReason: j.errorReason ?? j.errorMessage ?? `facilitator ${res.status}`,
        };
      }
      return { success: true, transaction: j.transaction, network: r.network, payer: j.payer };
    } catch (e) {
      return { success: false, transaction: '', network: r.network, payer: '', errorReason: `facilitator unreachable: ${(e as Error).message}` };
    }
  }

  async signPayment(r: PaymentRequirements): Promise<PaymentPayload> {
    const key: any = await this.loadKey();
    const publicKeyHex: string = key.publicKey.toHex();
    const now = Math.floor(Date.now() / 1000);
    const validAfter = now - 5;
    const validBefore = now + r.maxTimeoutSeconds;
    const nonceHex = randomBytes(32).toString('hex'); // 32 bytes = bytes32, 64 hex chars

    // Wire authorization (camelCase, as /verify documents it).
    const authorization: Authorization = {
      from: publicKeyHex,
      to: r.payTo,
      value: r.maxAmountRequired,
      validAfter: String(validAfter),
      validBefore: String(validBefore),
      nonce: nonceHex,
    };

    // EIP-712 digest, exactly like make-software/casper-x402:
    // TransferWithAuthorization typed data over a domain built from the CEP-18
    // token name/version, the Casper chain name, and the token contract hash.
    const eipSpec = '@casper-ecosystem/casper-eip-712';
    const eip712: any = await import(eipSpec);
    const tokenName = this.cfg.casperTokenName || (r.extra as any)?.name || 'USD';
    const tokenVersion = this.cfg.casperTokenVersion || (r.extra as any)?.version || '1';
    const domain = eip712.buildDomain(tokenName, tokenVersion, this.chainName(), r.asset);
    const message = {
      from: authorization.from,
      to: authorization.to,
      value: authorization.value,
      valid_after: validAfter,
      valid_before: validBefore,
      nonce: '0x' + nonceHex,
    };
    const digest: Uint8Array = eip712.hashTypedData(
      domain,
      eip712.TransferAuthorizationTypes,
      'TransferWithAuthorization',
      message,
    );

    // Ed25519-sign the 32-byte digest; normalize to [algo 0x01][64 sig] => 130 hex.
    const rawSig: any = await key.sign(digest);
    const sigBytes: Uint8Array =
      rawSig instanceof Uint8Array ? rawSig
      : typeof rawSig?.bytes === 'function' ? rawSig.bytes()
      : typeof rawSig?.toBytes === 'function' ? rawSig.toBytes()
      : Uint8Array.from(rawSig);
    const prefixed = sigBytes.length === 65 ? sigBytes : Uint8Array.from([0x01, ...sigBytes]);
    const signature = Buffer.from(prefixed).toString('hex');

    return {
      x402Version: 2,
      scheme: 'exact',
      network: r.network,
      payload: { signature, publicKey: publicKeyHex, authorization },
    };
  }
}
