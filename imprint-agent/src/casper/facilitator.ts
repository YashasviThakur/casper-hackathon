import type { AppConfig } from '../config.js';
import type {
  Authorization,
  PaymentPayload,
  PaymentRequirements,
  SettlementResponse,
  SupportedKinds,
  VerifyResponse,
} from '../x402/types.js';
import { MockFacilitator } from './mock-facilitator.js';
import { CasperFacilitator } from './casper-facilitator.js';

/**
 * The single seam between mock and real. Middleware and client only ever see
 * this interface, so flipping IMPRINT_MODE changes nothing else in the app.
 */
export interface Facilitator {
  /** Which (scheme, network) pairs this facilitator can settle. */
  supported(): Promise<SupportedKinds>;
  /** Off-chain validation of a signed payment (no chain write). */
  verify(p: PaymentPayload, r: PaymentRequirements): Promise<VerifyResponse>;
  /** Validate AND submit on-chain; returns the tx hash. */
  settle(p: PaymentPayload, r: PaymentRequirements): Promise<SettlementResponse>;
  /** CLIENT side: build a signed payment for the given requirements. */
  signPayment(r: PaymentRequirements): Promise<PaymentPayload>;
}

export function makeFacilitator(cfg: AppConfig): Facilitator {
  return cfg.mode === 'mock' ? new MockFacilitator(cfg) : new CasperFacilitator(cfg);
}

/**
 * Stable JSON (fixed key order) over an Authorization — used as the signing
 * preimage (real) and to make the mock signature deterministic. Both sides
 * must agree on this exact serialization.
 */
export function canonicalAuthorization(a: Authorization): string {
  return JSON.stringify({
    from: a.from,
    to: a.to,
    value: a.value,
    validAfter: a.validAfter,
    validBefore: a.validBefore,
    nonce: a.nonce,
  });
}
