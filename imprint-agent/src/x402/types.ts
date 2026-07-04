/**
 * Exact x402 (v1) wire shapes. No logic — just the JSON contract that
 * travels over the X-PAYMENT / X-PAYMENT-RESPONSE headers and the 402 body.
 *
 * IMPORTANT: every on-chain numeric value (amounts, timestamps) is a STRING
 * (uint256 safety). Compare with BigInt, never coerce to Number for math.
 */

export interface PaymentRequirements {
  scheme: 'exact';
  network: string;
  /** Atomic token units as a string, e.g. "1000000". */
  maxAmountRequired: string;
  /** CEP-18 token contract (Casper) / ERC-20 (EVM) accepted as payment. */
  asset: string;
  /** Recipient of the payment (payee account). */
  payTo: string;
  /** The resource being paid for (URL/path). */
  resource: string;
  description: string;
  mimeType?: string;
  outputSchema?: object | null;
  maxTimeoutSeconds: number;
  /** Scheme-specific extras (e.g. EIP-712 domain: { name, version }). */
  extra?: Record<string, unknown>;
}

export interface Authorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface PaymentPayload {
  /** 1 for the internal mock flow; 2 for the real Casper facilitator (x402 v2). */
  x402Version: number;
  scheme: 'exact';
  network: string;
  payload: {
    signature: string;
    /** Casper nests the payer public key alongside the signature. */
    publicKey?: string;
    authorization: Authorization;
  };
}

/** JSON body of a 402 response. */
export interface PaymentRequirementsResponse {
  x402Version: 1;
  error: string;
  accepts: PaymentRequirements[];
}

export interface VerifyResponse {
  isValid: boolean;
  payer?: string;
  invalidReason?: string;
}

export interface SettlementResponse {
  success: boolean;
  /** On-chain tx hash (empty string on failure). */
  transaction: string;
  network: string;
  payer: string;
  errorReason?: string;
}

export interface SupportedKinds {
  kinds: Array<{ x402Version: number; scheme: string; network: string }>;
}
