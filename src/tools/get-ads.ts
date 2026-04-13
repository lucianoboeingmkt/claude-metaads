import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FacebookClient } from '../facebook-client.js';

const DEFAULT_FIELDS = 'id,name,status,effective_status,adset_id,campaign_id,creative{id,name,thumbnail_url}';

export function registerGetAdsTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_get_ads',
    'Get individual ads for an ad account, optionally filtered by ad set or status',
    {
      account_id: z.string().describe('Ad account ID (numeric, without "act_" prefix)'),
      adset_id: z.string().optional().describe('Filter ads to this ad set ID'),
      status: z.enum(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED']).optional().describe('Filter by effective status'),
      limit: z.number().optional().describe('Max results (default 25, max 100)'),
      fields: z.string().optional().describe(`Comma-separated fields. Default: ${DEFAULT_FIELDS}`),
      after: z.string().optional().describe('Pagination cursor'),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {
          fields: args.fields ?? DEFAULT_FIELDS,
        };
        if (args.limit) params.limit = String(args.limit);
        if (args.after) params.after = args.after;
        if (args.status) {
          params.filtering = JSON.stringify([
            { field: 'effective_status', operator: 'IN', value: [args.status] },
          ]);
        }

        const path = args.adset_id
          ? `/${args.adset_id}/ads`
          : `/act_${args.account_id}/ads`;

        const result = await client.get(path, params);

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
