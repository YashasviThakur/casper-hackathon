import dotenv from 'dotenv';

// override:true so THIS project's .env wins over any pre-existing IMPRINT_* env
// vars already in the shell (e.g. from other Imprint projects) — otherwise a
// global IMPRINT_API_BASE would silently shadow our local config.
dotenv.config({ override: true });

/** Every runtime setting, parsed once. This is the ONLY file that reads process.env. */
export interface AppConfig {
  mode: 'mock' | 'real';
  apiBase: string;
  port: number;
  dataFile: string;
  priceSave: string;
  priceSearch: string;
  embedder: string;
  network: string;
  asset: string;
  payTo: string;
  facilitatorUrl: string;
  csprCloudToken: string;
  casperPrivateKeyHex: string;
  casperNodeRpc: string;
  casperTokenName: string;
  casperTokenVersion: string;
  geminiApiKey: string;
  openaiApiKey: string;
}

function env(name: string, def = ''): string {
  const v = process.env[name];
  return v === undefined || v === '' ? def : v;
}

export function loadConfig(): AppConfig {
  const mode = env('IMPRINT_MODE', 'mock');
  if (mode !== 'mock' && mode !== 'real') {
    throw new Error(`IMPRINT_MODE must be 'mock' or 'real', got '${mode}'`);
  }

  const cfg: AppConfig = {
    mode,
    apiBase: env('IMPRINT_API_BASE', 'http://localhost:4021'),
    port: Number(env('PORT', '4021')),
    dataFile: env('IMPRINT_DATA_FILE', './data/memories.jsonl'),
    priceSave: env('IMPRINT_PRICE_SAVE', '1000000'),
    priceSearch: env('IMPRINT_PRICE_SEARCH', '500000'),
    embedder: env('EMBEDDER', 'mock'),
    network: env('X402_NETWORK', 'casper:casper-test'),
    asset: env('X402_ASSET', '0'.repeat(64)),
    payTo: env('X402_PAY_TO', '01' + 'ab'.repeat(31) + 'ab'),
    facilitatorUrl: env('CASPER_FACILITATOR_URL', 'https://x402-facilitator.cspr.cloud'),
    csprCloudToken: env('CSPR_CLOUD_TOKEN'),
    casperPrivateKeyHex: env('CASPER_PRIVATE_KEY_HEX'),
    casperNodeRpc: env('CASPER_NODE_RPC', 'https://node.testnet.cspr.cloud/rpc'),
    casperTokenName: env('X402_TOKEN_NAME'),
    casperTokenVersion: env('X402_TOKEN_VERSION', '1'),
    geminiApiKey: env('GEMINI_API_KEY'),
    openaiApiKey: env('OPENAI_API_KEY'),
  };

  if (cfg.mode === 'real') {
    const missing: string[] = [];
    if (!cfg.facilitatorUrl) missing.push('CASPER_FACILITATOR_URL');
    if (!cfg.csprCloudToken) missing.push('CSPR_CLOUD_TOKEN');
    if (!cfg.casperPrivateKeyHex) missing.push('CASPER_PRIVATE_KEY_HEX');
    if (!cfg.asset) missing.push('X402_ASSET');
    if (!cfg.payTo) missing.push('X402_PAY_TO');
    if (missing.length) {
      throw new Error(
        `REAL_MODE requires: ${missing.join(', ')}. Fill them in .env, or use IMPRINT_MODE=mock. See SETUP.md.`,
      );
    }
  }

  return cfg;
}

export const config = loadConfig();
export const isMock = config.mode === 'mock';
