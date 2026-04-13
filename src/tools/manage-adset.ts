import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FacebookClient } from '../facebook-client.js';

export function registerUpdateAdsetTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_update_adset',
    'Update an existing ad set (pause/activate, change budget, adjust bid, rename)',
    {
      adset_id: z.string().describe('Ad set ID to update'),
      name: z.string().optional().describe('New ad set name'),
      status: z.enum(['ACTIVE', 'PAUSED']).optional().describe('New status'),
      daily_budget: z.string().optional().describe('New daily budget in cents'),
      lifetime_budget: z.string().optional().describe('New lifetime budget in cents'),
      bid_amount: z.string().optional().describe('New bid amount in cents'),
      end_time: z.string().optional().describe('New end time in ISO 8601 format'),
    },
    async (args) => {
      try {
        const data: Record<string, string> = {};
        if (args.name) data.name = args.name;
        if (args.status) data.status = args.status;
        if (args.daily_budget) data.daily_budget = args.daily_budget;
        if (args.lifetime_budget) data.lifetime_budget = args.lifetime_budget;
        if (args.bid_amount) data.bid_amount = args.bid_amount;
        if (args.end_time) data.end_time = args.end_time;

        const result = await client.post(`/${args.adset_id}`, data);

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
