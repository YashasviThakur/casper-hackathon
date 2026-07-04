import type { RequestHandler } from 'express';
import type { AppConfig } from '../config.js';
import type { Facilitator } from '../casper/facilitator.js';
import type { PaymentPayload, PaymentRequirements, SettlementResponse } from './types.js';
import { HEADER_PAYMENT, HEADER_PAYMENT_RESPONSE, decodeHeader, encodeHeader, getHeader } from './codec.js';

export interface PaymentGateOpts {
  price: string;
  description: string;
  facilitator: Facilitator;
  config: AppConfig;
}

/**
 * Express middleware that gates a route behind the x402 402 paywall.
 *
 * The un-paid first attempt short-circuits with 402 BEFORE the route handler
 * runs, so the paid retry is the only request with side effects (idempotency-safe).
 * On success it stashes the receipt on res.locals.payment for the handler.
 */
export function paymentGate(opts: PaymentGateOpts): RequestHandler {
  return async (req, res, next) => {
    const reqs: PaymentRequirements = {
      scheme: 'exact',
      network: opts.config.network,
      maxAmountRequired: opts.price,
      asset: opts.config.asset,
      payTo: opts.config.payTo,
      resource: req.originalUrl,
      description: opts.description,
      mimeType: 'application/json',
      maxTimeoutSeconds: 60,
      extra: {},
    };

    const header = getHeader(req, HEADER_PAYMENT);
    if (!header) {
      res.status(402).json({ x402Version: 1, error: 'X-PAYMENT header is required', accepts: [reqs] });
      return;
    }

    let payload: PaymentPayload;
    try {
      payload = decodeHeader<PaymentPayload>(header);
    } catch {
      res.status(402).json({ x402Version: 1, error: 'malformed X-PAYMENT header', accepts: [reqs] });
      return;
    }

    let s: SettlementResponse;
    try {
      const v = await opts.facilitator.verify(payload, reqs);
      if (!v.isValid) {
        res.status(402).json({ x402Version: 1, error: v.invalidReason ?? 'payment verification failed', accepts: [reqs] });
        return;
      }
      s = await opts.facilitator.settle(payload, reqs);
    } catch (e) {
      // e.g. real facilitator unreachable / transport error. Never hang the request.
      res.status(502).json({ x402Version: 1, error: `payment processing error: ${(e as Error).message}`, accepts: [reqs] });
      return;
    }

    res.setHeader(HEADER_PAYMENT_RESPONSE, encodeHeader(s));
    if (!s.success) {
      res.status(402).json({ x402Version: 1, error: s.errorReason ?? 'settlement failed', accepts: [reqs] });
      return;
    }

    res.locals.payment = {
      payer: s.payer,
      tx: s.transaction,
      amount: reqs.maxAmountRequired,
      network: reqs.network,
    };
    next();
  };
}
