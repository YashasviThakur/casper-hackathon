import { createHash, randomBytes } from 'node:crypto';
import type { AppConfig } from '../config.js';
import type { Facilitator } from './facilitator.js';
import { canonicalAuthorization } from './facilitator.js';
import type {
  Authorization,
  PaymentPayload,
  PaymentRequirements,
  SettlementResponse,
  SupportedKinds,
  VerifyResponse,
} from '../x402/types.js';

/** A fixed, obviously-fake payer account used in mock mode. */
const MOCK_PAYER = '01' + 'ab'.repeat(31) + 'ab';

/**
 * Offline, deterministic facilitator. The x402 wire protocol runs for REAL
 * (402 -> signed header -> verify -> settle -> settlement header); only the
 * crypto + chain operations are simulated. Crucially it enforces the SAME
 * invariants a real facilitator would (amount, time-window, scheme, replay),
 * so bugs surface offline instead of on testnet.
 */
export class MockFacilitator implements Facilitator {
  private seenNonces = new Set<string>();

  constructor(private cfg: AppConfig) {}

  async supported(): Promise<SupportedKinds> {
    return { kinds: [{ x402Version: 1, scheme: 'exact', network: this.cfg.network }] };
  }

  async signPayment(r: PaymentRequirements): Promise<PaymentPayload> {
    const now = Math.floor(Date.now() / 1000);
    const auth: Authorization = {
      from: MOCK_PAYER,
      to: r.payTo,
      value: r.maxAmountRequired,
      validAfter: String(now - 5),
      validBefore: String(now + r.maxTimeoutSeconds),
      nonce: '0x' + randomBytes(32).toString('hex'),
    };
    const signature =
      '0xMOCK' + createHash('sha256').update(canonicalAuthorization(auth)).digest('hex');
    return {
      x402Version: 1,
      scheme: 'exact',
      network: r.network,
      payload: { signature, publicKey: MOCK_PAYER, authorization: auth },
    };
  }

  /** Shared invariant checks (used by both verify and settle). */
  private checkInvariants(p: PaymentPayload, r: PaymentRequirements): VerifyResponse {
    // Defensively handle a malformed/hostile payment payload instead of throwing.
    const a = p?.payload?.authorization;
    if (!a || typeof a.value !== 'string' || typeof a.from !== 'string' || typeof a.validAfter !== 'string' || typeof a.validBefore !== 'string' || typeof a.nonce !== 'string') {
      return { isValid: false, invalidReason: 'malformed_payload' };
    }
    if (p.scheme !== 'exact') return { isValid: false, invalidReason: 'invalid_scheme', payer: a.from };
    if (p.network !== r.network) return { isValid: false, invalidReason: 'network_mismatch', payer: a.from };
    if (!/^\d+$/.test(a.value) || BigInt(a.value) !== BigInt(r.maxAmountRequired)) {
      return { isValid: false, invalidReason: 'invalid_amount', payer: a.from };
    }
    const now = Math.floor(Date.now() / 1000);
    if (Number(a.validAfter) > now || now > Number(a.validBefore)) {
      return { isValid: false, invalidReason: 'expired', payer: a.from };
    }
    return { isValid: true, payer: a.from };
  }

  async verify(p: PaymentPayload, r: PaymentRequirements): Promise<VerifyResponse> {
    const base = this.checkInvariants(p, r);
    if (!base.isValid) return base;
    if (this.seenNonces.has(p.payload.authorization.nonce)) {
      return { isValid: false, invalidReason: 'nonce_replayed', payer: p.payload.authorization.from };
    }
    return base;
  }

  async settle(p: PaymentPayload, r: PaymentRequirements): Promise<SettlementResponse> {
    const a = p.payload.authorization;
    const inv = this.checkInvariants(p, r);
    if (!inv.isValid) {
      return { success: false, transaction: '', network: r.network, payer: '', errorReason: inv.invalidReason };
    }
    if (this.seenNonces.has(a.nonce)) {
      return { success: false, transaction: '', network: r.network, payer: '', errorReason: 'nonce_replayed' };
    }
    this.seenNonces.add(a.nonce); // consume the nonce (replay protection)
    const transaction =
      'mock-' + createHash('sha256').update(a.nonce + a.value + r.payTo).digest('hex').slice(0, 60);
    return { success: true, transaction, network: r.network, payer: a.from };
  }
}
