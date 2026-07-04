#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { config } from '../config.js';
import { makeFacilitator } from '../casper/index.js';
import { payAndFetch } from '../x402/client.js';

/**
 * Layer 4: the MCP (stdio) server an AI agent connects to. Each tool
 * internally runs the x402 pay-and-fetch handshake against the HTTP memory
 * service, so from the agent's perspective it just calls a tool — the CSPR
 * micro-payment happens invisibly.
 *
 * CRITICAL: never write to stdout (it is the JSON-RPC channel) — log to stderr.
 */
const facilitator = makeFacilitator(config);
const server = new McpServer({ name: 'imprint', version: '0.1.0' });

server.registerTool(
  'save_memory',
  {
    description: 'Persist a fact to long-term memory. Costs a micro-payment in CSPR via x402.',
    inputSchema: {
      text: z.string().describe('the fact to remember'),
      topic: z.string().optional().describe('optional topic tag'),
    },
  },
  async ({ text, topic }) => {
    try {
      const { data, settlement } = await payAndFetch<{ id: string; receipt: any }>({
        method: 'POST',
        url: `${config.apiBase}/memories`,
        body: { text, topic },
        facilitator,
      });
      return {
        content: [
          {
            type: 'text' as const,
            text: `Saved memory ${data.id}. Paid ${data.receipt.amount} on ${data.receipt.network}, tx ${settlement?.transaction ?? data.receipt.tx}.`,
          },
        ],
      };
    } catch (e: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
    }
  },
);

server.registerTool(
  'search_memories',
  {
    description: 'Semantic search over stored memories. Costs a micro-payment in CSPR via x402.',
    inputSchema: {
      query: z.string().describe('what to recall'),
      topK: z.number().optional().describe('max results (default 5)'),
    },
  },
  async ({ query, topK }) => {
    try {
      const { data, settlement } = await payAndFetch<{ results: Array<{ text: string; score: number }> }>({
        method: 'POST',
        url: `${config.apiBase}/memories/search`,
        body: { query, topK },
        facilitator,
      });
      const lines = data.results.map((r) => `• (${r.score.toFixed(3)}) ${r.text}`).join('\n') || '(no memories yet)';
      return { content: [{ type: 'text' as const, text: `Recalled (paid tx ${settlement?.transaction}):\n${lines}` }] };
    } catch (e: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
    }
  },
);

server.registerTool(
  'get_memory',
  {
    description: 'Fetch one memory by id. Costs a micro-payment in CSPR via x402.',
    inputSchema: { id: z.string().describe('memory id') },
  },
  async ({ id }) => {
    try {
      const { data } = await payAndFetch<{ id: string; text: string }>({
        method: 'GET',
        url: `${config.apiBase}/memory/${id}`,
        facilitator,
      });
      return { content: [{ type: 'text' as const, text: data.text }] };
    } catch (e: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
    }
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Imprint MCP on stdio, mode=${config.mode}, api=${config.apiBase}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
