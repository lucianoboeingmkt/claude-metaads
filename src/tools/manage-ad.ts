import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FacebookClient } from '../facebook-client.js';

export function registerUpdateAdTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_update_ad',
    'Update an existing ad (pause/activate, rename)',
    {
      ad_id: z.string().describe('Ad ID to update'),
      name: z.string().optional().describe('New ad name'),
      status: z.enum(['ACTIVE', 'PAUSED']).optional().describe('New status'),
    },
    async (args) => {
      try {
        const data: Record<string, string> = {};
        if (args.name) data.name = args.name;
        if (args.status) data.status = args.status;

        const result = await client.post(`/${args.ad_id}`, data);

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
