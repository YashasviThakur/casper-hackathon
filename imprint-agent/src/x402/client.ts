import type { Facilitator } from '../casper/facilitator.js';
import type { PaymentRequirementsResponse, SettlementResponse } from './types.js';
import { HEADER_PAYMENT, HEADER_PAYMENT_RESPONSE, decodeHeader, encodeHeader } from './codec.js';

export interface PayAndFetchArgs {
  method: 'GET' | 'POST';
  url: string;
  body?: unknown;
  facilitator: Facilitator;
}

/**
 * The x402 CLIENT: do the request; on 402, read the payment requirements, ask
 * the facilitator to SIGN a payment, and retry ONCE with the X-PAYMENT header.
 * Hand-rolled (rather than an x402 SDK) so one code path is identical in mock
 * and real mode and never blocked by x402 v1/v2 SDK incompatibility.
 */
export async function payAndFetch<T = any>(
  args: PayAndFetchArgs,
): Promise<{ data: T; settlement?: SettlementResponse }> {
  const baseHeaders: Record<string, string> = { 'content-type': 'application/json' };
  const bodyStr = args.body !== undefined ? JSON.stringify(args.body) : undefined;

  const first = await fetch(args.url, { method: args.method, headers: baseHeaders, body: bodyStr });
  if (first.status !== 402) {
    if (!first.ok) throw new Error(`request failed ${first.status}: ${await first.text()}`);
    return { data: (await first.json()) as T };
  }

  const reqResp = (await first.json()) as PaymentRequirementsResponse;
  const reqs = reqResp.accepts?.[0];
  if (!reqs) throw new Error('402 response contained no payment requirements');

  const payload = await args.facilitator.signPayment(reqs);
  const paid = await fetch(args.url, {
    method: args.method,
    headers: { ...baseHeaders, [HEADER_PAYMENT]: encodeHeader(payload) },
    body: bodyStr,
  });

  const settleHeader = paid.headers.get(HEADER_PAYMENT_RESPONSE);
  const settlement = settleHeader ? decodeHeader<SettlementResponse>(settleHeader) : undefined;
  if (!paid.ok) {
    throw new Error(`payment failed ${paid.status}: ${settlement?.errorReason ?? (await paid.text())}`);
  }
  return { data: (await paid.json()) as T, settlement };
}
