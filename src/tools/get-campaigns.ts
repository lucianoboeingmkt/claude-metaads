import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FacebookClient } from '../facebook-client.js';

const DEFAULT_FIELDS = 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time';

export function registerGetCampaignsTool(server: McpServer, client: FacebookClient): void {
  server.tool(
    'meta_get_campaigns',
    'Get campaigns for a specific ad account, with optional status filtering',
    {
      account_id: z.string().describe('Ad account ID (numeric, without "act_" prefix)'),
      status: z.enum(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED']).optional().describe('Filter by effective status'),
      limit: z.number().optional().describe('Max results to return (default 25, max 100)'),
      fields: z.string().optional().describe(`Comma-separated fields. Default: ${DEFAULT_FIELDS}`),
      after: z.string().optional().describe('Pagination cursor for next page'),
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

        const result = await client.get(`/act_${args.account_id}/campaigns`, params);

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
