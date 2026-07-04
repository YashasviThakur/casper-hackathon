import type { Request } from 'express';

/**
 * The ONLY place x402 header (de)serialization lives.
 *
 * v1 header names (X-PAYMENT / X-PAYMENT-RESPONSE). To speak v2 or the
 * Casper client's naming, change these two constants in one place.
 */
export const HEADER_PAYMENT = 'X-PAYMENT';
export const HEADER_PAYMENT_RESPONSE = 'X-PAYMENT-RESPONSE';

export function encodeHeader(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

export function decodeHeader<T>(h: string): T {
  return JSON.parse(Buffer.from(h, 'base64').toString('utf8')) as T;
}

/** Read a request header case-insensitively. */
export function getHeader(req: Request, name: string): string | undefined {
  const v = req.headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}
